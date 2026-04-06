from rest_framework import serializers

from .models import StaffUser


class StaffUserSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = StaffUser
        fields = [
            'id',
            'business',
            'business_name',
            'email',
            'password',
            'name',
            'role',
            'phone',
            'address',
            'join_date',
            'status',
            'permissions',
            'last_login_at',
            'created_at',
            'updated_at',
        ]
