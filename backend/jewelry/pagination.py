from rest_framework.pagination import PageNumberPagination


class CatalogPagination(PageNumberPagination):
    """Page-number pagination that lets the storefront request `?page_size=` (max 60)."""

    page_size_query_param = "page_size"
    max_page_size = 60
