"""Bundle src/ into the single self-contained ../index.html that gets deployed."""
import os, glob
here = os.path.dirname(os.path.abspath(__file__))
shell = open(os.path.join(here, 'shell.html'), encoding='utf-8').read()
head, body = shell.split('</style>', 1)
js = ''.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(here, '0*.js'))))
libs = ''.join(f'<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/{p}"></script>\n' for p in [
    'build/three.min.js', 'examples/js/shaders/CopyShader.js', 'examples/js/shaders/LuminosityHighPassShader.js',
    'examples/js/postprocessing/EffectComposer.js', 'examples/js/postprocessing/RenderPass.js',
    'examples/js/postprocessing/ShaderPass.js', 'examples/js/postprocessing/UnrealBloomPass.js',
    'examples/js/utils/BufferGeometryUtils.js'])
html = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="description" content="NEXUS STRIKE: ZERO HOUR, a 3D tactical first-person shooter mission built for Gaming Conf 2026 at WTC.">\n'
        + head + '[hidden]{display:none!important}\n</style>\n</head>\n<body>\n' + body + '\n' + libs
        + '<script>\n' + js + '\n</script>\n</body>\n</html>\n')
open(os.path.join(here, '..', 'index.html'), 'w', encoding='utf-8').write(html)
print('built index.html', len(html) // 1024, 'KB')
