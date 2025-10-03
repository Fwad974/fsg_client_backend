const s3ImageUpload = (s3, s3Bucket, path, file) => {
  const config = {
    Bucket: s3Bucket,
    Key: path,
    Body: file.buffer,
    ACL: 'public-read'
  }
  // stream.on('error', (error) => console.error(error))
  // config.Body = stream

  return new Promise((resolve, reject) => {
    s3.upload(config, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

export default s3ImageUpload
