import re
from decimal import Decimal

from rest_framework import serializers

from .models import (
    Availability,
    BespokeRequest,
    Category,
    ContactMessage,
    JewelryImage,
    JewelryItem,
    OrderOrReservation,
    ServiceInquiry,
)

PHONE_RE = re.compile(r"^\+?[0-9 ()/-]{9,20}$")
RING_SIZE_MIN, RING_SIZE_MAX = 44, 70
MAX_ENGRAVING = 40
MAX_QUANTITY = 10


def validate_phone(value: str) -> str:
    value = value.strip()
    if not PHONE_RE.match(value):
        raise serializers.ValidationError(
            "Zadajte platné telefónne číslo, napr. +421 905 123 456."
        )
    return value


def validate_name(value: str) -> str:
    value = value.strip()
    if len(value) < 3:
        raise serializers.ValidationError("Uveďte, prosím, celé meno a priezvisko.")
    return value


# --- Catalog -----------------------------------------------------------------


class CategorySerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "cover_image_url", "display_order", "item_count"]


class CategoryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class JewelryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = JewelryImage
        fields = ["id", "image_url", "caption", "display_order"]


class JewelryItemListSerializer(serializers.ModelSerializer):
    category = CategoryBriefSerializer(read_only=True)
    metal_type_display = serializers.CharField(source="get_metal_type_display", read_only=True)
    primary_gemstone_display = serializers.CharField(
        source="get_primary_gemstone_display", read_only=True
    )
    availability_display = serializers.CharField(source="get_availability_display", read_only=True)
    badge_display = serializers.CharField(source="get_badge_display", read_only=True)
    is_ring = serializers.BooleanField(read_only=True)

    class Meta:
        model = JewelryItem
        fields = [
            "id",
            "slug",
            "sku",
            "name",
            "collection_name",
            "category",
            "base_price",
            "metal_type",
            "metal_type_display",
            "gold_purity",
            "primary_gemstone",
            "primary_gemstone_display",
            "carat_weight",
            "availability",
            "availability_display",
            "badge",
            "badge_display",
            "cover_image_url",
            "is_featured",
            "is_ring",
            "created_at",
        ]


class JewelryItemDetailSerializer(JewelryItemListSerializer):
    images = JewelryImageSerializer(many=True, read_only=True)

    class Meta(JewelryItemListSerializer.Meta):
        fields = JewelryItemListSerializer.Meta.fields + [
            "diamond_grade",
            "weight_grams",
            "description",
            "images",
        ]


# --- Orders ------------------------------------------------------------------


class OrderLineSerializer(serializers.Serializer):
    slug = serializers.SlugField(max_length=220)
    quantity = serializers.IntegerField(min_value=1, max_value=MAX_QUANTITY, default=1)
    ring_size = serializers.IntegerField(
        required=False, allow_null=True, min_value=RING_SIZE_MIN, max_value=RING_SIZE_MAX
    )
    engraving = serializers.CharField(
        required=False, allow_blank=True, max_length=MAX_ENGRAVING, trim_whitespace=True
    )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderLineSerializer(many=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderOrReservation
        fields = [
            "id",
            "order_type",
            "items",
            "total_price",
            "client_name",
            "email",
            "phone",
            "delivery_address",
            "note",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at", "total_price"]

    def validate_client_name(self, value):
        return validate_name(value)

    def validate_phone(self, value):
        return validate_phone(value)

    def validate_items(self, lines):
        if not lines:
            raise serializers.ValidationError("Košík je prázdny – pridajte aspoň jeden šperk.")
        if len(lines) > 20:
            raise serializers.ValidationError("Objednávka môže obsahovať najviac 20 položiek.")

        slugs = {line["slug"] for line in lines}
        products = {p.slug: p for p in JewelryItem.objects.select_related("category").filter(slug__in=slugs)}

        resolved = []
        for line in lines:
            product = products.get(line["slug"])
            if product is None:
                raise serializers.ValidationError(f"Šperk „{line['slug']}“ sa nenašiel.")
            if product.availability == Availability.SOLD_OUT:
                raise serializers.ValidationError(
                    f"Šperk „{product.name}“ je momentálne vypredaný."
                )
            if product.is_ring and not line.get("ring_size"):
                raise serializers.ValidationError(
                    f"Pri šperku „{product.name}“ zvoľte veľkosť prsteňa."
                )
            unit_price = product.base_price
            resolved.append(
                {
                    "slug": product.slug,
                    "sku": product.sku,
                    "name": product.name,
                    "quantity": line.get("quantity", 1),
                    "ring_size": line.get("ring_size") if product.is_ring else None,
                    "engraving": (line.get("engraving") or "").strip(),
                    "unit_price": str(unit_price),
                    "line_total": str(unit_price * line.get("quantity", 1)),
                }
            )
        return resolved

    def validate(self, attrs):
        if attrs.get("order_type") == OrderOrReservation.OrderType.ESHOP:
            address = (attrs.get("delivery_address") or "").strip()
            if len(address) < 10:
                raise serializers.ValidationError(
                    {"delivery_address": "Pre doručenie kuriérom uveďte úplnú adresu (ulica, PSČ, mesto)."}
                )
        return attrs

    def create(self, validated_data):
        items = validated_data["items"]
        validated_data["total_price"] = sum(
            (Decimal(line["line_total"]) for line in items), Decimal("0")
        )
        return OrderOrReservation.objects.create(**validated_data)


# --- Inquiries ---------------------------------------------------------------


class BespokeRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = BespokeRequest
        fields = [
            "id",
            "jewelry_type",
            "preferred_metal",
            "gemstone_preference",
            "ring_sizes",
            "engraving_text",
            "estimated_budget",
            "description",
            "client_name",
            "phone",
            "email",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_client_name(self, value):
        return validate_name(value)

    def validate_phone(self, value):
        return validate_phone(value)

    def validate_description(self, value):
        if len(value.strip()) < 15:
            raise serializers.ValidationError(
                "Opíšte nám svoju predstavu aspoň jednou-dvomi vetami (min. 15 znakov)."
            )
        return value.strip()


class ServiceInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceInquiry
        fields = [
            "id",
            "service_type",
            "estimated_weight_grams",
            "note",
            "client_name",
            "phone",
            "email",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_client_name(self, value):
        return validate_name(value)

    def validate_phone(self, value):
        return validate_phone(value)


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = [
            "id",
            "topic",
            "preferred_date",
            "message",
            "client_name",
            "phone",
            "email",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_client_name(self, value):
        return validate_name(value)

    def validate_phone(self, value):
        return validate_phone(value) if value else value

    def validate_message(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Správa je príliš krátka (min. 10 znakov).")
        return value.strip()
