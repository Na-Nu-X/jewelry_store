from decimal import Decimal

from django.core.management import call_command
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import BespokeRequest, JewelryItem, OrderOrReservation, ServiceInquiry

NO_THROTTLE = {
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {"anon": None, "submissions": None},
}


@override_settings(REST_FRAMEWORK={
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "jewelry.pagination.CatalogPagination",
    "PAGE_SIZE": 24,
    **NO_THROTTLE,
})
class JewelryApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_data", verbosity=0)

    def test_seed_is_idempotent(self):
        before = JewelryItem.objects.count()
        call_command("seed_data", verbosity=0)
        self.assertEqual(JewelryItem.objects.count(), before)
        self.assertGreaterEqual(before, 12)

    def test_categories_with_counts(self):
        res = self.client.get("/api/categories/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 6)
        self.assertTrue(all(c["item_count"] > 0 for c in res.data))

    def test_filtering_and_ordering(self):
        res = self.client.get("/api/jewelry/", {"category": "zasnubne-prstene", "ordering": "base_price"})
        prices = [Decimal(r["base_price"]) for r in res.data["results"]]
        self.assertTrue(prices)
        self.assertEqual(prices, sorted(prices))
        self.assertTrue(all(r["category"]["slug"] == "zasnubne-prstene" for r in res.data["results"]))

        res = self.client.get("/api/jewelry/", {"metal_type": "platina,ruzove_zlato", "max_price": 3000})
        for r in res.data["results"]:
            self.assertIn(r["metal_type"], {"platina", "ruzove_zlato"})
            self.assertLessEqual(Decimal(r["base_price"]), 3000)

        res = self.client.get("/api/jewelry/", {"search": "ZP-AUR-001"})
        self.assertEqual(res.data["count"], 1)

        res = self.client.get("/api/jewelry/", {"featured": "true"})
        self.assertTrue(all(r["is_featured"] for r in res.data["results"]))

    def test_detail_includes_gallery(self):
        slug = JewelryItem.objects.get(sku="ZP-AUR-001").slug
        res = self.client.get(f"/api/jewelry/{slug}/")
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.data["images"]), 0)
        self.assertEqual(res.data["category"]["slug"], "zasnubne-prstene")
        self.assertTrue(res.data["is_ring"])

    def test_facets(self):
        res = self.client.get("/api/jewelry/facets/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("price_range", res.data)
        self.assertEqual(len(res.data["metal_types"]), 5)

    def _ring(self):
        return JewelryItem.objects.get(sku="ZP-AUR-002")

    def test_order_total_is_computed_server_side(self):
        ring = self._ring()
        res = self.client.post(
            "/api/orders/",
            {
                "order_type": "rezervacia_predajna",
                "items": [{"slug": ring.slug, "quantity": 2, "ring_size": 54, "engraving": "Navždy"}],
                "client_name": "Jana Nováková",
                "email": "jana@example.sk",
                "phone": "+421 905 123 456",
                "total_price": "1.00",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        order = OrderOrReservation.objects.get()
        self.assertEqual(order.total_price, ring.base_price * 2)
        self.assertEqual(order.items[0]["engraving"], "Navždy")

    def test_order_validation(self):
        ring = self._ring()
        sold_out = JewelryItem.objects.filter(availability="vypredane").first()
        base = {"client_name": "Jana Nováková", "email": "jana@example.sk", "phone": "+421905123456"}

        # Ring without size
        res = self.client.post("/api/orders/", {**base, "order_type": "rezervacia_predajna",
                                                "items": [{"slug": ring.slug}]}, format="json")
        self.assertEqual(res.status_code, 400)

        # Courier without address
        res = self.client.post("/api/orders/", {**base, "order_type": "eshop_objednavka",
                                                "items": [{"slug": ring.slug, "ring_size": 52}]}, format="json")
        self.assertIn("delivery_address", res.data)

        # Sold out
        res = self.client.post("/api/orders/", {**base, "order_type": "rezervacia_predajna",
                                                "items": [{"slug": sold_out.slug}]}, format="json")
        self.assertEqual(res.status_code, 400)

        # Empty bag & bad phone
        res = self.client.post("/api/orders/", {**base, "phone": "abc", "order_type": "rezervacia_predajna",
                                                "items": []}, format="json")
        self.assertIn("items", res.data)
        self.assertIn("phone", res.data)
        self.assertEqual(OrderOrReservation.objects.count(), 0)

    def test_bespoke_and_service(self):
        res = self.client.post("/api/bespoke/", {
            "jewelry_type": "svadobne_obrucky", "preferred_metal": "biele_zlato",
            "estimated_budget": "1 500 – 3 000 €", "description": "Hľadáme jednoduché obrúčky s jedným diamantom.",
            "client_name": "Peter Horváth", "phone": "0905 111 222", "email": "peter@example.sk",
        }, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(BespokeRequest.objects.count(), 1)

        res = self.client.post("/api/services/", {
            "service_type": "vykup_zlata", "estimated_weight_grams": "12.5",
            "client_name": "Eva Kováčová", "phone": "0905 111 222", "email": "eva@example.sk",
        }, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(ServiceInquiry.objects.count(), 1)

        res = self.client.post("/api/services/", {"service_type": "neznama"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_submissions_are_write_only(self):
        self.assertEqual(self.client.get("/api/orders/").status_code, 405)

    def test_page_size_param(self):
        res = self.client.get("/api/jewelry/", {"page_size": 5})
        self.assertEqual(len(res.data["results"]), 5)
        self.assertIsNotNone(res.data["next"])
