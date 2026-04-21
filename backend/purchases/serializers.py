from django.db import transaction
from rest_framework import serializers

from .models import Purchase


class PurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = '__all__'

    def validate(self, attrs):
        attrs = super().validate(attrs)
        business = attrs.get('business') or getattr(getattr(self.context.get('request'), 'user', None), 'business', None)
        product = attrs.get('product') or getattr(self.instance, 'product', None)

        if business and product and product.business_id != business.id:
            raise serializers.ValidationError({'product': 'You can only purchase products from your business.'})

        return attrs

    def _apply_purchase_to_product(self, *, product, quantity, unit_cost, supplier):
        product.stock += quantity
        product.cost = unit_cost
        if supplier and not product.supplier:
            product.supplier = supplier
        product.save(update_fields=['stock', 'cost', 'supplier', 'updated_at'])

    def _revert_purchase_from_product(self, *, product, quantity):
        if product.stock < quantity:
            raise serializers.ValidationError(
                {'quantity': f'Cannot reduce stock for {product.name} below zero.'}
            )
        product.stock -= quantity
        product.save(update_fields=['stock', 'updated_at'])

    def create(self, validated_data):
        with transaction.atomic():
            purchase = super().create(validated_data)
            self._apply_purchase_to_product(
                product=purchase.product,
                quantity=purchase.quantity,
                unit_cost=purchase.unit_cost,
                supplier=purchase.supplier,
            )
            return purchase

    def update(self, instance, validated_data):
        with transaction.atomic():
            self._revert_purchase_from_product(
                product=instance.product,
                quantity=instance.quantity,
            )
            purchase = super().update(instance, validated_data)
            self._apply_purchase_to_product(
                product=purchase.product,
                quantity=purchase.quantity,
                unit_cost=purchase.unit_cost,
                supplier=purchase.supplier,
            )
            return purchase
