#!/bin/bash

# 1. inject script
cat <<'END_SCRIPT' > inject_script.js
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZH6Q0QQ786"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-ZH6Q0QQ786');
</script>
END_SCRIPT

sed -i.bak '/<\/script>/r inject_script.js' index.html
rm index.html.bak inject_script.js

# 2. upgrades package.json dependencies to the latest versions
ncu --install always -p npm -u
ncu --install always -p pnpm -u