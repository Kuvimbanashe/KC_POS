from rest_framework import serializers

from .models import Asset, Expense, Product, Purchase, Sale, SaleItem, StaffUser


class StaffUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffUser
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = '__all__'


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


class PurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = '__all__'

    def create(self, validated_data):
        purchase = super().create(validated_data)
        product = purchase.product
        product.stock += purchase.quantity
        product.cost = purchase.unit_cost
        if purchase.supplier and not product.supplier:
            product.supplier = purchase.supplier
        product.save(update_fields=['stock', 'cost', 'supplier', 'updated_at'])
        return purchase


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'


class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = '__all__'
