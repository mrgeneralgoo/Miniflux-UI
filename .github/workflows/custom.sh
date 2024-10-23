#!/bin/bash

set -x

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

sed -i '/<\/script>/r inject_script.js' index.html
rm inject_script.js

file="./src/pages/Login.jsx"
line_number=$(grep -n 'placeholder="Please input api token"' "$file" | cut -d: -f1)
target_line=$((line_number - 2))
if [ "$target_line" -gt 0 ]; then
  sed -i "${target_line}s/<Input/<Input.Password/" "$file"
else
  echo "Ignore"
fi

# 2. upgrades package.json dependencies to the latest versions
rm -rf package-lock.json pnpm-lock.yaml
ncu --install always -p npm -u && npm install --package-lock-only
pnpm import package-lock.json
