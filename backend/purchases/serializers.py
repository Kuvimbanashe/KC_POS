from rest_framework import serializers

from .models import Purchase


class PurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = '__all__'

    def validate(self, attrs):
        attrs = super().validate(attrs)
        business = attrs.get('business') or getattr(getattr(self.context.get('request'), 'user', None), 'business', None)
        product = attrs.get('product')

        if business and product and product.business_id != business.id:
            raise serializers.ValidationError({'product': 'You can only purchase products from your business.'})

        return attrs

    def create(self, validated_data):
        purchase = super().create(validated_data)
        product = purchase.product
        product.stock += purchase.quantity
        product.cost = purchase.unit_cost
        if purchase.supplier and not product.supplier:
            product.supplier = purchase.supplier
        product.save(update_fields=['stock', 'cost', 'supplier', 'updated_at'])
        return purchase
