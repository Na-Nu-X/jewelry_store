import django_filters

from .models import JewelryItem


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    """Accepts comma-separated values, e.g. `?metal_type=zlte_zlato,biele_zlato`."""


class JewelryItemFilter(django_filters.FilterSet):
    category = CharInFilter(field_name="category__slug", lookup_expr="in")
    metal_type = CharInFilter(field_name="metal_type", lookup_expr="in")
    primary_gemstone = CharInFilter(field_name="primary_gemstone", lookup_expr="in")
    availability = CharInFilter(field_name="availability", lookup_expr="in")
    badge = CharInFilter(field_name="badge", lookup_expr="in")
    min_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="lte")
    featured = django_filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = JewelryItem
        fields = [
            "category",
            "metal_type",
            "primary_gemstone",
            "availability",
            "badge",
            "min_price",
            "max_price",
            "featured",
        ]
