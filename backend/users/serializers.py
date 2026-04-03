from rest_framework import serializers

from .authentication import hash_password
from .models import StaffUser


class StaffUserSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)

    class Meta:
        model = StaffUser
        fields = (
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
        )
        read_only_fields = ('business', 'business_name', 'last_login_at', 'created_at', 'updated_at')
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'This field is required.'})
        if attrs.get('email'):
            attrs['email'] = attrs['email'].strip().lower()
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        if not validated_data.get('permissions'):
            validated_data['permissions'] = ['all'] if validated_data.get('role') == 'admin' else ['sales']

        user = StaffUser(**validated_data)
        user.password = hash_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.password = hash_password(password)

        instance.save()
        return instance
