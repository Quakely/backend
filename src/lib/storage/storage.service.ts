import * as fs from "fs";
import {injectable, singleton} from "tsyringe";
import {Storage} from "@google-cloud/storage"
import {getLogger} from "../../index";

@singleton()
@injectable()
export class StorageService {

    private storage: Storage;

    constructor() {
        this.storage = new Storage({
            projectId: 'crested-unity-414117',
            keyFilename: 'config/quakely-google-key.json'
        });
    }

    public async uploadFileToStorageBucket(filePath: string, fileName: string, folderName: string) {
        const bucketName = 'gs://quakely';

        const bucket = this.storage.bucket(bucketName);
        const destFileName = `${folderName}/${fileName}`;

        const [file, metadata] = await bucket.upload(filePath, {
            destination: destFileName
        });

        fs.unlinkSync(filePath);
        return file.publicUrl().replaceAll("%2F", "/");
    }
    public async hasFileInStorageBucket(fileName: string, folderName: string) {
        const bucketName = 'gs://quakely';

        const bucket = this.storage.bucket(bucketName);
        const destFileName = `${folderName}/${fileName}`;

        const file = bucket.file(destFileName);

        try {
            const [exists] = await file.exists();
            return exists;
        } catch (error) {
            console.error('Failed to check if file exists:', error);
            return false;
        }
    }
    public async deleteFileFromStorageBucket(imageUrl: string, folderName: string) {
        const bucketName = 'gs://quakely';
        const oldImageName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
        const oldImageBucket = this.storage.bucket(bucketName);

        try {
            await oldImageBucket.file(`${folderName}/${oldImageName}`).delete();
        } catch (error) {
            getLogger().logger.error(`Failed to remove ${oldImageName} from Google Storage.`, error);
        }
    }
}
