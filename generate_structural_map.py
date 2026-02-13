import os
import json
import glob
import datetime
import ast
import re

# Directorio raíz del proyecto (asumiendo que el script se ejecuta desde la raíz)
ROOT_DIR = '.'
SRC_DIR = os.path.join(ROOT_DIR, 'src')
OUTPUT_JSON = os.path.join(ROOT_DIR, 'conductor', 'structural_map.json')
OUTPUT_MD = os.path.join(ROOT_DIR, 'conductor', 'structural_map.md')

def find_source_files():
    """Encuentra todos los archivos .ts y .tsx en el directorio src."""
    ts_files = glob.glob(os.path.join(SRC_DIR, '**/*.ts'), recursive=True)
    tsx_files = glob.glob(os.path.join(SRC_DIR, '**/*.tsx'), recursive=True)
    # Normaliza las rutas para que sean consistentes entre sistemas operativos
    return sorted([os.path.normpath(f) for f in ts_files + tsx_files])

def resolve_import_path(import_path, current_file_dir):
    """Resuelve una ruta de importación relativa a una ruta de archivo del proyecto."""
    # Solo nos interesan las dependencias internas, no librerías como 'react'
    if not import_path.startswith('.'):
        return None

    abs_path = os.path.normpath(os.path.join(current_file_dir, import_path))

    # Pruebas para resolver la ruta a un archivo real
    possible_paths = [
        abs_path + '.ts',
        abs_path + '.tsx',
        os.path.join(abs_path, 'index.ts'),
        os.path.join(abs_path, 'index.tsx')
    ]

    for path in possible_paths:
        if os.path.isfile(path):
            return os.path.normpath(path)
            
    return None # No se pudo resolver a un archivo conocido del proyecto

def extract_dependencies(file_path):
    """Extrae las dependencias de un archivo usando el módulo AST para un análisis seguro."""
    dependencies = set()
    current_file_dir = os.path.dirname(file_path)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # El decorador 'experimentalDecorators' puede dar problemas, lo filtramos
            tree = ast.parse(content.replace('@experimentalDecorators', ''))
            for node in ast.walk(tree):
                if isinstance(node, ast.ImportFrom) and node.module:
                    resolved = resolve_import_path(node.module, current_file_dir)
                    if resolved:
                        dependencies.add(resolved)
    except Exception:
        # Ignoramos archivos que no se puedan parsear (ej. sintaxis muy experimental)
        pass
    return sorted(list(dependencies))

def find_and_summarize_context_files():
    """Encuentra y resume brevemente los archivos de contexto y planes."""
    main_gemini_file = os.path.join(ROOT_DIR, 'GEMINI.md')
    context_summary = "Contexto no extraído."
    if os.path.exists(main_gemini_file):
        with open(main_gemini_file, 'r', encoding='utf-8') as f:
            # Búsqueda simple de una sección relevante.
            content = f.read()
            match = re.search(r'#.*(Arquitectura|Flujo|Contexto de Proyecto|Lecciones Aprendidas).*', content, re.IGNORECASE)
            if match:
                context_summary = f"Extracto de {os.path.basename(main_gemini_file)}: '{match.group(0)}...'"

    plan_files = glob.glob(os.path.join(ROOT_DIR, 'conductor/tracks/**/plan.md'), recursive=True)
    return os.path.normpath(main_gemini_file), context_summary, sorted([os.path.normpath(p) for p in plan_files])

def main():
    """Función principal para generar el mapa estructural."""
    print("Generando mapa estructural del proyecto...")
    source_files = find_source_files()
    
    dependencies = {}
    for f in source_files:
        deps = extract_dependencies(f)
        if deps:
            dependencies[f] = deps
    
    main_context_file, context_summary, plan_files = find_and_summarize_context_files()

    structural_map = {
        "last_updated": datetime.datetime.now().isoformat(),
        "file_count": len(source_files),
        "files": source_files,
        "dependencies": dependencies,
        "main_context_file": main_context_file,
        "modules_overview": context_summary,
        "known_plans_linked": plan_files
    }

    # Asegurarse de que el directorio conductor existe
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(structural_map, f, indent=2)
    print(f"Mapa estructural JSON guardado en: {OUTPUT_JSON}")

    # Generar versión Markdown para lectura rápida
    md_content = [
        f"# Mapa Estructural del Proyecto\n\n",
        f"*Última actualización: {structural_map['last_updated']}*\n\n",
        f"## Resumen\n\n",
        f"- **Archivos de código fuente analizados:** {structural_map['file_count']}\n",
        f"- **Archivo de contexto principal:** `{structural_map['main_context_file']}`\n",
        f"- **Planes de trabajo detectados:** {len(structural_map['known_plans_linked'])}\n\n",
        f"## Resumen del Contexto\n\n```\n{structural_map['modules_overview']}\n```\n\n",
        f"## Dependencias Clave (Archivos con > 3 dependencias)\n\n"
    ]

    # Filtrar dependencias para mostrar solo las más conectadas
    sorted_deps = sorted(dependencies.items(), key=lambda item: len(item[1]), reverse=True)
    
    count = 0
    for file, deps in sorted_deps:
        if len(deps) > 3:
            md_content.append(f"- `{file}` ({len(deps)} dependencias)\n")
            count += 1
        if count >= 5: # Limitar a los 5 más conectados para brevedad
            break
    if count == 0:
        md_content.append("No se detectaron archivos con un alto número de dependencias.\n")
        
    md_content.append("\n_Este es un resumen autogenerado. Para ver el mapa completo, consulta `structural_map.json`._")
    
    with open(OUTPUT_MD, 'w', encoding='utf-8') as f:
        f.write("".join(md_content))
        
    print(f"Resumen en Markdown guardado en: {OUTPUT_MD}")


if __name__ == "__main__":
    main()
