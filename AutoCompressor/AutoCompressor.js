const zlib = require('zlib');

const { createGzip } = require('zlib');
const { pipeline } = require('stream');
const {
    createReadStream,
    createWriteStream
} = require('fs');

const { promisify } = require('util');
const pipe = promisify(pipeline);

const fs = require('fs');

async function do_gzip(input, output) {
    const gzip = createGzip();
    const source = createReadStream(input);
    const destination = createWriteStream(output);
    await pipe(source, gzip, destination);
}

async function autoCompressor (dir) {
    try {
        console.log(`Папка ${dir} сканируется.`);
        let dirContent = await readDirPromise(dir);
        for (let i = 0; i < dirContent.length; i++) {
            const item = dir + '/' + dirContent[i];
            const fileStat = await getFileStatPromise(item);

            if (fileStat.isFile() && !(/.gz$/.test(dirContent[i]))) {
                await checkGzibFileExistAndFresh(dir, dirContent[i], dirContent, fileStat.mtime);
            } else if (fileStat.isDirectory()) {
                await autoCompressor(item);
            }
        }
    } catch (e) {
        console.log('autoCompressor error: ', e);
    }
}

async function checkGzibFileExistAndFresh (dir, file, dirContent, fileMtime) {
    const gzipFile = `${file}.gz`;
    const gzipFileFullPath = `${dir}/${gzipFile}`;
    for (let i = 0; i < dirContent.length; i++) {
        if (dirContent[i] === (gzipFile)) {
            const gzipFileStat = await getFileStatPromise(gzipFileFullPath);
            if (fileMtime  > gzipFileStat.mtime) {
                console.log(`Архив ${gzipFileFullPath} начал обновление`);
                await do_gzip(`${dir}/${file}`, gzipFileFullPath);
                console.log(`Архив ${gzipFileFullPath} закончил обновление`);
            }
            return;
        }
    }
    console.log(`Архив ${gzipFileFullPath} начал создание`);
    await do_gzip(`${dir}/${file}`, gzipFileFullPath);
    console.log(`Архив ${gzipFileFullPath} закончил создание`);
}

autoCompressor ('mainDir');

function readDirPromise(directory) {
    return new Promise( (resolve,reject) => {
        fs.readdir(directory, (error, files) => {
            if (error) reject(error);
            else resolve(files);
        });
    } );
}
function getFileStatPromise(file) {
    return new Promise( (resolve, reject)=> {
        fs.stat(file, function(error, stat) {
            if (error) reject(error);
            else resolve(stat);
        })
    })
}