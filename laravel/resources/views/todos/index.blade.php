<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List - {{ config('app.name') }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #333; margin-bottom: 20px; }
        .card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px; }
        .form-group { display: flex; gap: 10px; }
        input[type="text"] { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
        button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .btn-primary { background: #4299e1; color: white; }
        .btn-primary:hover { background: #3182ce; }
        .btn-danger { background: #fc8181; color: white; }
        .btn-danger:hover { background: #f56565; }
        .btn-sm { padding: 5px 10px; font-size: 12px; }
        .todo-list { list-style: none; }
        .todo-item { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee; }
        .todo-item:last-child { border-bottom: none; }
        .todo-checkbox { margin-right: 12px; }
        .todo-title { flex: 1; font-size: 16px; }
        .todo-title.completed { text-decoration: line-through; color: #999; }
        .todo-actions { display: flex; gap: 8px; }
        .empty { text-align: center; color: #999; padding: 20px; }
        .nav { margin-bottom: 20px; }
        .nav a { color: #4299e1; text-decoration: none; margin-right: 15px; }
        .nav a:hover { text-decoration: underline; }
        .alert { padding: 10px 15px; border-radius: 4px; margin-bottom: 15px; }
        .alert-success { background: #c6f6d5; color: #276749; }
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

        <h1>Todo List</h1>

        @if(session('success'))
            <div class="alert alert-success">{{ session('success') }}</div>
        @endif

        <div class="card">
            <form action="{{ route('todos.store') }}" method="POST">
                @csrf
                <div class="form-group">
                    <input type="text" name="title" placeholder="What needs to be done?" required>
                    <button type="submit" class="btn-primary">Add</button>
                </div>
            </form>
        </div>

        <div class="card">
            @if($todos->isEmpty())
                <div class="empty">No todos yet. Add one above!</div>
            @else
                <ul class="todo-list">
                    @foreach($todos as $todo)
                        <li class="todo-item">
                            <form action="{{ route('todos.toggle', $todo) }}" method="POST" class="todo-checkbox">
                                @csrf
                                @method('PATCH')
                                <input type="checkbox" onchange="this.form.submit()" {{ $todo->completed ? 'checked' : '' }}>
                            </form>
                            <span class="todo-title {{ $todo->completed ? 'completed' : '' }}">
                                {{ $todo->title }}
                            </span>
                            <div class="todo-actions">
                                <form action="{{ route('todos.destroy', $todo) }}" method="POST">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="btn-danger btn-sm">Delete</button>
                                </form>
                            </div>
                        </li>
                    @endforeach
                </ul>
            @endif
        </div>

        <p style="color: #999; font-size: 12px; text-align: center;">
            Total: {{ $todos->count() }} | Completed: {{ $todos->where('completed', true)->count() }}
        </p>
    </div>
</body>
</html>
