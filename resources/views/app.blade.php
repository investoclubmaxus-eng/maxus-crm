<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    @viteReactRefresh

    @vite([
        'resources/css/app.css',
        'resources/js/app.jsx'
    ])

    <title>MAXUS Super Admin</title>

    <script>
        document.addEventListener("DOMContentLoaded", async () => {
            try {
                const response = await fetch(
                    "{{ url('/api/superadmin/settings/general') }}"
                );

                if (!response.ok) {
                    return;
                }

                const result = await response.json();

                const faviconUrl = result?.data?.favicon_url;

                if (!faviconUrl) {
                    return;
                }

                const favicon = document.createElement("link");

                favicon.rel = "icon";
                favicon.type = "image/x-icon";
                favicon.href = `${faviconUrl}?v=${Date.now()}`;

                document.head.appendChild(favicon);

            } catch (error) {
                console.error(
                    "Unable to load favicon:",
                    error
                );
            }
        });
    </script>

</head>

<body>

    <div id="app"></div>

</body>

</html>