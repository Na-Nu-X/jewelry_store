from django.contrib import admin
from django.utils.html import format_html, format_html_join

from .models import (
    BespokeRequest,
    Category,
    ContactMessage,
    JewelryImage,
    JewelryItem,
    OrderOrReservation,
    ServiceInquiry,
)


def thumbnail(url: str, size: int = 56):
    if not url:
        return "—"
    return format_html(
        '<img src="{}" style="width:{}px;height:{}px;object-fit:cover;border-radius:4px;" alt="">',
        url,
        size,
        size,
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("preview", "name", "slug", "display_order", "item_count")
    list_display_links = ("preview", "name")
    list_editable = ("display_order",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)

    @admin.display(description="Náhľad")
    def preview(self, obj):
        return thumbnail(obj.cover_image_url)

    @admin.display(description="Počet šperkov")
    def item_count(self, obj):
        return obj.items.count()


class JewelryImageInline(admin.TabularInline):
    model = JewelryImage
    extra = 1
    fields = ("preview", "image_url", "caption", "display_order")
    readonly_fields = ("preview",)

    @admin.display(description="Náhľad")
    def preview(self, obj):
        return thumbnail(obj.image_url, 72)


@admin.action(description="Označiť ako „Skladom v predajni“")
def mark_in_stock(modeladmin, request, queryset):
    queryset.update(availability="skladom")


@admin.action(description="Označiť ako „Vypredané“")
def mark_sold_out(modeladmin, request, queryset):
    queryset.update(availability="vypredane")


@admin.action(description="Zobraziť medzi vybranými klenotmi")
def mark_featured(modeladmin, request, queryset):
    queryset.update(is_featured=True)


@admin.register(JewelryItem)
class JewelryItemAdmin(admin.ModelAdmin):
    list_display = (
        "preview",
        "name",
        "sku",
        "category",
        "metal_type",
        "gold_purity",
        "base_price",
        "availability",
        "badge",
        "is_featured",
    )
    list_display_links = ("preview", "name")
    list_editable = ("base_price", "availability", "badge", "is_featured")
    list_filter = ("category", "metal_type", "primary_gemstone", "availability", "badge", "is_featured")
    search_fields = ("name", "sku", "collection_name")
    prepopulated_fields = {"slug": ("name",)}
    list_select_related = ("category",)
    list_per_page = 30
    inlines = [JewelryImageInline]
    actions = [mark_in_stock, mark_sold_out, mark_featured]
    readonly_fields = ("created_at", "cover_preview")
    fieldsets = (
        ("Základné údaje", {"fields": ("name", "slug", "sku", "category", "collection_name", "description")}),
        ("Cena a dostupnosť", {"fields": ("base_price", "availability", "badge", "is_featured")}),
        (
            "Kov a drahokam",
            {
                "fields": (
                    ("metal_type", "gold_purity"),
                    ("primary_gemstone", "carat_weight"),
                    "diamond_grade",
                    "weight_grams",
                )
            },
        ),
        ("Fotografia", {"fields": ("cover_image_url", "cover_preview")}),
        ("Systém", {"fields": ("created_at",), "classes": ("collapse",)}),
    )

    @admin.display(description="Náhľad")
    def preview(self, obj):
        return thumbnail(obj.cover_image_url)

    @admin.display(description="Náhľad titulnej fotografie")
    def cover_preview(self, obj):
        return thumbnail(obj.cover_image_url, 220)


@admin.register(OrderOrReservation)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at", "client_name", "order_type", "total_price", "status", "phone")
    list_filter = ("order_type", "status", "created_at")
    list_editable = ("status",)
    search_fields = ("client_name", "email", "phone")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "items_table", "total_price")
    exclude = ("items",)
    fieldsets = (
        ("Objednávka", {"fields": ("order_type", "status", "created_at", "total_price", "items_table")}),
        ("Zákazník", {"fields": ("client_name", "email", "phone", "delivery_address", "note")}),
    )

    @admin.display(description="Položky")
    def items_table(self, obj):
        if not obj.items:
            return "—"
        rows = format_html_join(
            "",
            "<tr><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{} €</td></tr>",
            (
                (
                    line.get("name", line.get("slug")),
                    line.get("sku", ""),
                    line.get("quantity", 1),
                    line.get("ring_size") or "—",
                    line.get("engraving") or "—",
                    line.get("line_total", ""),
                )
                for line in obj.items
            ),
        )
        return format_html(
            '<table style="min-width:520px"><thead><tr><th>Šperk</th><th>Kód</th><th>Ks</th>'
            "<th>Veľkosť</th><th>Gravírovanie</th><th>Spolu</th></tr></thead><tbody>{}</tbody></table>",
            rows,
        )


@admin.register(BespokeRequest)
class BespokeRequestAdmin(admin.ModelAdmin):
    list_display = ("created_at", "client_name", "jewelry_type", "preferred_metal", "estimated_budget", "is_reviewed")
    list_filter = ("jewelry_type", "preferred_metal", "gemstone_preference", "is_reviewed")
    list_editable = ("is_reviewed",)
    search_fields = ("client_name", "email", "phone", "description")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at",)


@admin.register(ServiceInquiry)
class ServiceInquiryAdmin(admin.ModelAdmin):
    list_display = ("created_at", "client_name", "service_type", "estimated_weight_grams", "phone", "is_resolved")
    list_filter = ("service_type", "is_resolved")
    list_editable = ("is_resolved",)
    search_fields = ("client_name", "email", "phone", "note")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at",)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("created_at", "client_name", "topic", "preferred_date", "email", "is_resolved")
    list_filter = ("topic", "is_resolved")
    list_editable = ("is_resolved",)
    search_fields = ("client_name", "email", "message")
    readonly_fields = ("created_at",)
