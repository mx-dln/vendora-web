<?php

namespace App\Services\Assistant;

use App\Models\KnowledgeArticle;

class KnowledgeService
{
    public function search(string $query): ?array
    {
        $articles = KnowledgeArticle::where('is_active', true)->get();
        $best = null;
        $bestScore = 0;

        foreach ($articles as $article) {
            $score = $this->matchScore($query, $article);
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $article;
            }
        }

        if ($best && $bestScore > 0.1) {
            return ['title' => $best->title, 'content' => $best->content, 'category' => $best->category];
        }

        return null;
    }

    private function matchScore(string $query, KnowledgeArticle $article): float
    {
        $q = strtolower($query);
        $score = 0;

        if (str_contains(strtolower($article->title), $q)) {
            $score += 0.8;
        }
        if ($article->keywords) {
            foreach (explode(',', $article->keywords) as $kw) {
                if (str_contains($q, strtolower(trim($kw)))) {
                    $score += 0.5;
                }
            }
        }
        if (str_contains(strtolower($article->content), $q)) {
            $score += 0.2;
        }

        return $score;
    }
}
