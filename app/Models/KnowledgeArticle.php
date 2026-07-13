<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KnowledgeArticle extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'slug', 'category', 'keywords', 'content', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'bool'];
    }
}
