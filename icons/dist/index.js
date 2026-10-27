// File extension mappings for essential icons
const FileExtensions1ToIcon = {
    // Web Development
    html: 'file_type_html.svg',
    htm: 'file_type_html.svg',
    xhtml: 'file_type_html.svg',
    css: 'file_type_css.svg',
    scss: 'file_type_css.svg',
    sass: 'file_type_css.svg',
    less: 'file_type_css.svg',
    js: 'file_type_js.svg',
    mjs: 'file_type_js.svg',
    cjs: 'file_type_js.svg',
    ts: 'file_type_typescript.svg',
    tsx: 'file_type_typescript.svg',
    json: 'file_type_json.svg',
    jsonc: 'file_type_json.svg',
    xml: 'file_type_xml.svg',
    xsd: 'file_type_xml.svg',
    xsl: 'file_type_xml.svg',
    // Programming Languages
    py: 'file_type_python.svg',
    pyw: 'file_type_python.svg',
    pyc: 'file_type_python.svg',
    pyo: 'file_type_python.svg',
    java: 'file_type_java.svg',
    class: 'file_type_java.svg',
    jar: 'file_type_java.svg',
    c: 'file_type_c.svg',
    h: 'file_type_c.svg',
    cpp: 'file_type_cpp.svg',
    cxx: 'file_type_cpp.svg',
    cc: 'file_type_cpp.svg',
    hpp: 'file_type_cpp.svg',
    hxx: 'file_type_cpp.svg',
    cs: 'file_type_csharp.svg',
    csx: 'file_type_csharp.svg',
    php: 'file_type_php.svg',
    phtml: 'file_type_php.svg',
    php3: 'file_type_php.svg',
    php4: 'file_type_php.svg',
    php5: 'file_type_php.svg',
    go: 'file_type_go.svg',
    rs: 'file_type_rust.svg',
    rlib: 'file_type_rust.svg',
    rb: 'file_type_ruby.svg',
    erb: 'file_type_ruby.svg',
    gemspec: 'file_type_ruby.svg',
    swift: 'file_type_swift.svg',
    kt: 'file_type_kotlin.svg',
    kts: 'file_type_kotlin.svg',
    // Data & Config
    yaml: 'file_type_yaml.svg',
    yml: 'file_type_yaml.svg',
    toml: 'file_type_toml.svg',
    ini: 'file_type_ini.svg',
    cfg: 'file_type_ini.svg',
    conf: 'file_type_ini.svg',
    sql: 'file_type_sql.svg',
    mysql: 'file_type_sql.svg',
    pgsql: 'file_type_sql.svg',
    // Documentation
    md: 'file_type_markdown.svg',
    markdown: 'file_type_markdown.svg',
    mdown: 'file_type_markdown.svg',
    // Images & Media
    svg: 'file_type_svg.svg',
    // Documents
    pdf: 'file_type_pdf.svg',
    xlsx: 'file_type_excel.svg',
    xls: 'file_type_excel.svg',
    xlsm: 'file_type_excel.svg',
    // Archives
    zip: 'file_type_zip.svg',
    rar: 'file_type_zip.svg',
    '7z': 'file_type_zip.svg',
    tar: 'file_type_zip.svg',
    gz: 'file_type_zip.svg',
    // System
    sh: 'file_type_shell.svg',
    bash: 'file_type_shell.svg',
    zsh: 'file_type_shell.svg',
    ps1: 'file_type_powershell.svg',
    psm1: 'file_type_powershell.svg',
    log: 'file_type_log.svg',
    out: 'file_type_log.svg'
};
// Specific filename mappings
const FileNamesToIcon = {
    'package.json': 'file_type_package.svg',
    'package-lock.json': 'file_type_package.svg',
    '.gitignore': 'file_type_git.svg',
    '.gitattributes': 'file_type_git.svg',
    'Dockerfile': 'file_type_docker.svg',
    'docker-compose.yml': 'file_type_docker.svg',
    'CMakeLists.txt': 'file_type_cmake.svg',
    'Makefile': 'file_type_cmake.svg',
    'LICENSE': 'file_type_license.svg',
    'LICENSE.txt': 'file_type_license.svg',
    'LICENSE.md': 'file_type_license.svg',
    'README.md': 'file_type_markdown.svg',
    'CHANGELOG.md': 'file_type_markdown.svg'
};
export const DEFAULT_FOLDER = 'default_folder.svg';
export const DEFAULT_FILE = 'default_file.svg';
/**
 * Get icon for a folder
 * @param folderName name of folder to find icon for
 * @return icon filename
 */
export function getIconForFolder(folderName) {
    return DEFAULT_FOLDER;
}
let prevExtension = undefined;
let prevIcon = undefined;
/**
 * Get icon for a file
 * @param fileName name of file to find icon for
 * @return icon filename
 */
export function getIconForFile(fileName) {
    // match by exact FileName
    const iconFromFileName = FileNamesToIcon[fileName];
    if (iconFromFileName !== undefined) {
        return iconFromFileName;
    }
    // match by File Extension
    const extensions = fileName.split('.');
    if (extensions.length > 2) {
        const ext1 = extensions.pop();
        if (!ext1) {
            return DEFAULT_FILE;
        }
        if (ext1 === prevExtension) {
            return prevIcon;
        }
        const iconFromExtension1 = FileExtensions1ToIcon[ext1];
        if (iconFromExtension1 !== undefined) {
            prevExtension = ext1;
            prevIcon = iconFromExtension1;
            return iconFromExtension1;
        }
    }
    else {
        const ext = extensions.pop();
        if (!ext) {
            return DEFAULT_FILE;
        }
        if (ext === prevExtension) {
            return prevIcon;
        }
        const iconFromExtension = FileExtensions1ToIcon[ext];
        if (iconFromExtension !== undefined) {
            prevExtension = ext;
            prevIcon = iconFromExtension;
            return iconFromExtension;
        }
    }
    return DEFAULT_FILE;
}
