<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Counter - {{ config('app.name') }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 400px; margin: 0 auto; text-align: center; }
        h1 { color: #333; margin-bottom: 20px; }
        .card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 40px; margin-bottom: 20px; }
        .count { font-size: 72px; font-weight: bold; color: #4299e1; margin-bottom: 30px; }
        .buttons { display: flex; gap: 10px; justify-content: center; }
        button { padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: bold; transition: transform 0.1s; }
        button:active { transform: scale(0.95); }
        .btn-primary { background: #4299e1; color: white; }
        .btn-primary:hover { background: #3182ce; }
        .btn-secondary { background: #e2e8f0; color: #4a5568; }
        .btn-secondary:hover { background: #cbd5e0; }
        .btn-danger { background: #fc8181; color: white; }
        .btn-danger:hover { background: #f56565; }
        .nav { margin-bottom: 20px; }
        .nav a { color: #4299e1; text-decoration: none; margin-right: 15px; }
        .nav a:hover { text-decoration: underline; }
        .info { color: #999; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="nav">
            <a href="/">Home</a>
            <a href="/info">Info</a>
            <a href="/health">Health</a>
            <a href="/todos">Todos</a>
            <a href="/counter">Counter</a>
            <a href="/api/status">API</a>
        </div>

        <h1>Counter</h1>

        <div class="card">
            <div class="count">{{ $count }}</div>
            <div class="buttons">
                <form action="{{ route('counter.decrement') }}" method="POST" style="display: inline;">
                    @csrf
                    <button type="submit" class="btn-secondary">-</button>
                </form>
                <form action="{{ route('counter.increment') }}" method="POST" style="display: inline;">
                    @csrf
                    <button type="submit" class="btn-primary">+</button>
                </form>
            </div>
        </div>

        <form action="{{ route('counter.reset') }}" method="POST">
            @csrf
            <button type="submit" class="btn-danger">Reset</button>
        </form>

        <p class="info">Session-based counter (resets when session expires)</p>
    </div>
</body>
</html>
