import ServiceBase from '../../libs/serviceBase'
// import ajv from '../../libs/ajv'
import AWS from 'aws-sdk'
import s3ImageUpload from '../../utils/s3ImageUpload'
import s3FetchAndDelete from '../../utils/s3FetchAndDelete'
import { v4 as uuid } from 'uuid'
import config from '../../configs/app.config'

// const schema = {
//   type: 'object',
//   properties: {},
//   required: []
// }

// const constraints = ajv.compile(schema)

/**
 * Provides service for the updating user profile photo functionality
 * @export
 * @class UploadProfilePhotoService
 * @extends {ServiceBase}
 */
export default class UploadProfilePhotoService extends ServiceBase {
  // get constraints () {
  //   return constraints
  // }

  async run () {
    const {
      dbModels: { User: UserModel },
      auth: { id: userId },
      sequelizeTransaction
    } = this.context

    const file = this.args[0]
    const bucketName = config.get('aws.s3.bucket_name')

    try {
      // const awaitedFile = await file
      let storedImagePath = {}
      //  const stream = await file.createReadStream()
      const originalName = file.originalname.split('.')[0]
      let fileName = `${originalName}_${userId}_${uuid()}.${file.mimetype.split('/')[1]}`
      fileName = fileName.split(' ').join('')

      // // Configuring AWS S3 object
      // await AWS.config.update({
      //   accessKeyId: config.get('aws.s3.access_key_id'),
      //   secretAccessKey: config.get('aws.s3.secret_access_key'),
      //   region: config.get('aws.s3.region')
      // })

      const bucketPath = `userProfileImage/${userId}/${fileName}`

      const s3 = new AWS.S3({
        accessKeyId: config.get('aws.s3.access_key_id'),
        secretAccessKey: config.get('aws.s3.secret_access_key'),
        region: config.get('aws.s3.region')
      })

      await s3FetchAndDelete(s3, bucketName, userId)
      storedImagePath = await s3ImageUpload(s3, bucketName, bucketPath, file)

      if (storedImagePath) {
        const updated = await UserModel.update({
          profileImageUrl: storedImagePath.Location
        }, {
          where: {
            id: userId
          },
          transaction: sequelizeTransaction
        })

        return {
          uploaded: updated[0] === 1,
          location: storedImagePath.Location
        }
      } else {
        return this.addError('FileUploadFailedErrorType', 'File upload failed')
      }
    } catch (e) {
      return this.addError('SomethingWentWrongErrorType', 'Something went wrong')
    }
  }
}
