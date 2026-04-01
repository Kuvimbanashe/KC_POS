from rest_framework import serializers

from .models import Sale, SaleItem


class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = '__all__'
        extra_kwargs = {
            'sale': {'read_only': True, 'required': False},
        }


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)

    class Meta:
        model = Sale
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        sale = Sale.objects.create(**validated_data)
        for item_data in items_data:
            product = item_data['product']
            qty = item_data['quantity']
            unit_type = item_data.get('unit_type', 'single')
            pack_size = item_data.get('pack_size') or product.pack_size or 1
            reduce_qty = qty * pack_size if unit_type == 'pack' else qty
            product.stock = max(0, product.stock - reduce_qty)
            product.save(update_fields=['stock', 'updated_at'])
            SaleItem.objects.create(sale=sale, **item_data)
        return sale
