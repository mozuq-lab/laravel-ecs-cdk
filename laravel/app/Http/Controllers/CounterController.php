<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class CounterController extends Controller
{
    public function index(): View
    {
        $count = session('counter', 0);
        return view('counter', compact('count'));
    }

    public function increment(): RedirectResponse
    {
        $count = session('counter', 0);
        session(['counter' => $count + 1]);
        return redirect()->route('counter');
    }

    public function decrement(): RedirectResponse
    {
        $count = session('counter', 0);
        session(['counter' => max(0, $count - 1)]);
        return redirect()->route('counter');
    }

    public function reset(): RedirectResponse
    {
        session()->forget('counter');
        return redirect()->route('counter');
    }
}
