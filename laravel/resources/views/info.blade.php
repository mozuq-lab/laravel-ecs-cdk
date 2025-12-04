<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Info - {{ config('app.name') }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; margin-bottom: 20px; }
        .card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; overflow: hidden; }
        .card-header { background: #4a5568; color: white; padding: 12px 20px; font-weight: bold; }
        .card-body { padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eee; }
        th { width: 30%; color: #666; font-weight: 500; }
        td { color: #333; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
        .badge-success { background: #48bb78; color: white; }
        .badge-warning { background: #ed8936; color: white; }
        .extensions { display: flex; flex-wrap: wrap; gap: 4px; }
        .ext { background: #edf2f7; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
        a { color: #4299e1; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .nav { margin-bottom: 20px; }
        .nav a { margin-right: 15px; }
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

        <h1>Server Information</h1>

        <div class="card">
            <div class="card-header">Application</div>
            <div class="card-body">
                <table>
                    <tr><th>Name</th><td>{{ $info['app']['name'] }}</td></tr>
                    <tr><th>Environment</th><td>
                        <span class="badge {{ $info['app']['environment'] === 'production' ? 'badge-success' : 'badge-warning' }}">
                            {{ $info['app']['environment'] }}
                        </span>
                    </td></tr>
                    <tr><th>Debug Mode</th><td>{{ $info['app']['debug'] ? 'Enabled' : 'Disabled' }}</td></tr>
                    <tr><th>URL</th><td>{{ $info['app']['url'] }}</td></tr>
                </table>
            </div>
        </div>

        <div class="card">
            <div class="card-header">Laravel</div>
            <div class="card-body">
                <table>
                    <tr><th>Version</th><td>{{ $info['laravel']['version'] }}</td></tr>
                </table>
            </div>
        </div>

        <div class="card">
            <div class="card-header">PHP</div>
            <div class="card-body">
                <table>
                    <tr><th>Version</th><td>{{ $info['php']['version'] }}</td></tr>
                    <tr><th>SAPI</th><td>{{ $info['php']['sapi'] }}</td></tr>
                    <tr><th>Extensions</th><td>
                        <div class="extensions">
                            @foreach($info['php']['extensions'] as $ext)
                                <span class="ext">{{ $ext }}</span>
                            @endforeach
                        </div>
                    </td></tr>
                </table>
            </div>
        </div>

        <div class="card">
            <div class="card-header">Server</div>
            <div class="card-body">
                <table>
                    <tr><th>Hostname</th><td>{{ $info['server']['hostname'] }}</td></tr>
                    <tr><th>OS</th><td>{{ $info['server']['os'] }}</td></tr>
                    <tr><th>Server Software</th><td>{{ $info['server']['server_software'] }}</td></tr>
                    <tr><th>Document Root</th><td>{{ $info['server']['document_root'] }}</td></tr>
                </table>
            </div>
        </div>

        <div class="card">
            <div class="card-header">Request</div>
            <div class="card-body">
                <table>
                    <tr><th>IP Address</th><td>{{ $info['request']['ip'] }}</td></tr>
                    <tr><th>User Agent</th><td>{{ $info['request']['user_agent'] }}</td></tr>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
