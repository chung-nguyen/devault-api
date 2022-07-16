import AWS from 'aws-sdk';

let kms;

export default function (bytesCount) {  
  if (!kms) {
    kms = new AWS.KMS();
  }

  return new Promise((resolve, reject) => {
    const params = {
      NumberOfBytes: bytesCount
    };

    kms.generateRandom(params, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.Plaintext);
      }
    });
  });
};
