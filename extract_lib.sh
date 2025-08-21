files="node_modules/typescript/lib/lib.*.d.ts"

for file in $files; do
    if [[ -f $file ]]; then
        file_name=$(basename "$file") 
        file_name="${file_name%.d.ts}"
        lib_file_name="${file_name//./_}"
        echo "import $lib_file_name from \"inline:$file\";"
    fi
done

echo "const libFiles = new Map<string, string>();"
for file in $files; do
    if [[ -f $file ]]; then
        file_name=$(basename "$file")
        file_name="${file_name%.d.ts}"
        normalized_file_name="${file_name//./_}"
        echo "libFiles.set(\"$file_name.d.ts\", $normalized_file_name);"
    fi 
done
