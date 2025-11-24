from django.contrib import admin
from .models import Exercise

@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'level', 'equipment', 'mechanic', 'force')
    search_fields = ('name', 'category')
    list_filter = ('category', 'level', 'equipment', 'mechanic', 'force')
    ordering = ('name',)
    readonly_fields = ('id',)
    fieldsets = (
        (None, {
            'fields': ('name', 'source_id', 'category', 'level', 'mechanic', 'force', 'equipment')
        }),
        ('Muscles', {
            'fields': ('primary_muscles', 'secondary_muscles')
        }),
        ('Instructions', {
            'fields': ('instructions',)
        }),
    )