from rest_framework import serializers

from .models import StaffUser


class StaffUserSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)

    class Meta:
        model = StaffUser
        fields = '__all__'
