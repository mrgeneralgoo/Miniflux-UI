#!/bin/bash

# 1. inject script
inject_script="<!-- Google tag (gtag.js) -->
<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-ZH6Q0QQ786\"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-ZH6Q0QQ786');
</script>"

sed -i.bak "/<\/body>/i $inject_script" index.html
rm index.html.bak

# 2. upgrades package.json dependencies to the latest versions
ncu --install always -p npm -u
ncu --install always -p pnpm -u