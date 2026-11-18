from django.db.models import Count, Max, Min, Q
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .filters import JewelryItemFilter
from .models import (
    Availability,
    BespokeRequest,
    Category,
    ContactMessage,
    Gemstone,
    JewelryItem,
    MetalType,
    OrderOrReservation,
    ServiceInquiry,
)
from .serializers import (
    BespokeRequestSerializer,
    CategorySerializer,
    ContactMessageSerializer,
    JewelryItemDetailSerializer,
    JewelryItemListSerializer,
    OrderSerializer,
    ServiceInquirySerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/categories/ – categories with the number of items in each."""

    serializer_class = CategorySerializer
    lookup_field = "slug"
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        return Category.objects.annotate(item_count=Count("items")).order_by("display_order", "name")


class JewelryItemViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/jewelry/          – filterable, searchable, paginated catalog
    GET /api/jewelry/<slug>/   – full item dossier with gallery
    GET /api/jewelry/facets/   – filter options and price range for the catalog sidebar
    """

    lookup_field = "slug"
    filterset_class = JewelryItemFilter
    search_fields = ["name", "sku", "collection_name", "description"]
    ordering_fields = ["created_at", "base_price", "name", "carat_weight"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = JewelryItem.objects.select_related("category")
        if self.action == "retrieve":
            qs = qs.prefetch_related("images")
        return qs

    def get_serializer_class(self):
        return JewelryItemDetailSerializer if self.action == "retrieve" else JewelryItemListSerializer

    @action(detail=False, methods=["get"], pagination_class=None, filter_backends=[])
    def facets(self, request):
        prices = JewelryItem.objects.aggregate(min=Min("base_price"), max=Max("base_price"))
        categories = Category.objects.annotate(item_count=Count("items")).order_by("display_order")

        def counted(field, choices):
            counts = dict(
                JewelryItem.objects.values_list(field).annotate(c=Count("id")).values_list(field, "c")
            )
            return [
                {"value": value, "label": label, "count": counts.get(value, 0)}
                for value, label in choices
            ]

        return Response(
            {
                "categories": [
                    {"value": c.slug, "label": c.name, "count": c.item_count} for c in categories
                ],
                "metal_types": counted("metal_type", MetalType.choices),
                "gemstones": counted("primary_gemstone", Gemstone.choices),
                "availability": counted("availability", Availability.choices),
                "price_range": {
                    "min": prices["min"] or 0,
                    "max": prices["max"] or 0,
                },
            }
        )


class _CreateOnlyViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Public, write-only endpoint. Submissions are reviewed in Django Admin."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "submissions"


class OrderViewSet(_CreateOnlyViewSet):
    """POST /api/orders/ – online order or in-store reservation."""

    queryset = OrderOrReservation.objects.all()
    serializer_class = OrderSerializer


class BespokeRequestViewSet(_CreateOnlyViewSet):
    """POST /api/bespoke/ – custom jewelry / wedding bands inquiry."""

    queryset = BespokeRequest.objects.all()
    serializer_class = BespokeRequestSerializer


class ServiceInquiryViewSet(_CreateOnlyViewSet):
    """POST /api/services/ – gold buyback or goldsmith service inquiry."""

    queryset = ServiceInquiry.objects.all()
    serializer_class = ServiceInquirySerializer


class ContactMessageViewSet(_CreateOnlyViewSet):
    """POST /api/contact/ – atelier consultation / contact form."""

    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
