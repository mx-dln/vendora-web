<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssistantLog extends Model
{
    protected $fillable = ['user_id', 'original_question', 'normalized_question', 'detected_intent', 'confidence', 'response'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
