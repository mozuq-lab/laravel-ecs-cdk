<?php

use App\Http\Controllers\Api\StatusController;
use App\Http\Controllers\CounterController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\InfoController;
use App\Http\Controllers\TodoController;
use Illuminate\Support\Facades\Route;

// Home
Route::get('/', function () {
    return view('welcome');
});

// Health Check (for ALB)
Route::get('/health', [HealthController::class, 'check']);

// Server Info
Route::get('/info', [InfoController::class, 'index']);

// Todo List
Route::get('/todos', [TodoController::class, 'index'])->name('todos.index');
Route::post('/todos', [TodoController::class, 'store'])->name('todos.store');
Route::patch('/todos/{todo}/toggle', [TodoController::class, 'toggle'])->name('todos.toggle');
Route::delete('/todos/{todo}', [TodoController::class, 'destroy'])->name('todos.destroy');

// Counter
Route::get('/counter', [CounterController::class, 'index'])->name('counter');
Route::post('/counter/increment', [CounterController::class, 'increment'])->name('counter.increment');
Route::post('/counter/decrement', [CounterController::class, 'decrement'])->name('counter.decrement');
Route::post('/counter/reset', [CounterController::class, 'reset'])->name('counter.reset');

// API
Route::get('/api/status', [StatusController::class, 'index']);
