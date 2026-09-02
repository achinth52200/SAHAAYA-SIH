import os
path = r'C:\Users\Admin\Desktop\SIH project\sahaaya\apps\web\src\app\dashboard\states\[id]\page.tsx'
content = open(r'C:\Users\Admin\Desktop\SIH project\sahaaya\write_page2.py', 'r', encoding='utf-8').read()
start = content.find('content = """') + len('content = """')
end = content.rfind('"""')
content = content[start:end]
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('File written successfully')