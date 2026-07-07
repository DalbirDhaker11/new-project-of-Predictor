import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'if (!res.ok) throw new Error("Failed to auto compare");',
    'if (!res.ok) { const errData = await res.json().catch(()=>({})); throw new Error(errData.error || "Failed to auto compare"); }'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
