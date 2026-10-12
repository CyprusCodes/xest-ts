/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
import Minio from "minio";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { Request } from "express";
import { Readable } from "stream";

interface MulterStorageFile {
  originalname: string;
  stream: Readable;
}

interface StoredObjectFile extends MulterStorageFile {
  bucket: string;
  key: string;
}

type HandleFileCallback = (
  error: Error | null,
  info?: Record<string, unknown>
) => void;

type RemoveFileCallback = (error: unknown) => void;

interface MinioStorageEngine {
  _handleFile(
    req: Request,
    file: MulterStorageFile,
    cb: HandleFileCallback
  ): void;
  _removeFile(
    req: Request,
    file: StoredObjectFile,
    cb: RemoveFileCallback
  ): void;
}

interface MinioStorageConstructor {
  new (opts?: unknown): MinioStorageEngine;
}

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_HOST as string, // e.g: "minio.yourdomain.com"
  port: 443,
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY as string,
  secretKey: process.env.MINIO_SECRET_KEY as string
});

const bucket = process.env.BUCKET_NAME as string;

function MulterMinioStorage() {}

MulterMinioStorage.prototype._handleFile = function _handleFile(
  req: Request,
  file: MulterStorageFile,
  cb: HandleFileCallback
): void {
  const uniqFileName = uuidv4();
  const fileExt = path.extname(file.originalname);
  const key = `${uniqFileName}${fileExt}`;

  return minioClient.putObject(
    bucket,
    key,
    file.stream,
    function (err1, objInfo) {
      if (err1) {
        console.log(err1);
        return cb(err1);
      }
      return cb(null, {
        bucket,
        key,
        ...objInfo,
        publicURL: `https://${process.env.MINIO_HOST}/${bucket}/${key}`
      });
    }
  );
};

MulterMinioStorage.prototype._removeFile = function _removeFile(
  req: Request,
  file: StoredObjectFile,
  cb: RemoveFileCallback
): void {
  minioClient.removeObject(file.bucket, file.key, function (err) {
    if (err) {
      console.log("Unable to remove object", err);
      return cb(err);
    }
    return cb({
      removed: true
    });
  });
};

const multerMinioStorage = (opts?: unknown): MinioStorageEngine => {
  return new (MulterMinioStorage as unknown as MinioStorageConstructor)(opts);
};

export default multerMinioStorage;
