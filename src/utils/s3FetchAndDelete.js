const s3FetchAndDelete = async (s3Bucket, bucketName, userId) => {
  const params = {
    Bucket: bucketName,
    Prefix: `${userId}`
  }

  const listedObjects = await s3Bucket.listObjectsV2(params).promise()
  if (listedObjects.Contents.length === 0) {
    return
  }

  const deleteParams = {
    Bucket: bucketName,
    Delete: { Objects: [] }
  }

  listedObjects.Contents.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key })
  })

  await s3Bucket.deleteObjects(deleteParams).promise()

  if (listedObjects.IsTruncated) {
    await s3FetchAndDelete(s3Bucket, bucketName, userId)
  }
}

export default s3FetchAndDelete
