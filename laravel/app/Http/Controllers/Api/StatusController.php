<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Todo;
use Illuminate\Http\JsonResponse;

class StatusController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'app' => [
                'name' => config('app.name'),
                'version' => app()->version(),
                'environment' => config('app.env'),
            ],
            'server' => [
                'php_version' => PHP_VERSION,
                'hostname' => gethostname(),
                'timestamp' => now()->toIso8601String(),
            ],
            'stats' => [
                'todos_count' => Todo::count(),
                'completed_todos' => Todo::where('completed', true)->count(),
            ],
        ]);
    }
}
