package store

import (
	"context"
	"io"
	"log"
	"os"
	"sgs/internal/models"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const (
	MaxObjectPartSize = 128000000
)

// configs
var (
	endpoint        = os.Getenv("STORE_ADDR")
	accessKeyID     = os.Getenv("STORE_USER")
	secretAccessKey = os.Getenv("STORE_PASSWORD")
	useSSL          = false
)

type Store struct {
	client *minio.Client
}

// New sets up a connection to the underlying minio store and initialize a client object. A non-nil error is returned when the connection fails
func New() (*Store, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, err
	}
	log.Println("store connected successfully")
	return &Store{client: client}, nil
}

// CreateBucket creates a new bucket for use. A non-nil error is returned if the bucket already exists
func (s *Store) CreateBucket(ctx context.Context, name string, enableLocking bool) error {
	return s.client.MakeBucket(ctx, name, minio.MakeBucketOptions{ObjectLocking: enableLocking})
}

// ListBuckets lists all the available buckets within the cluster
func (s *Store) ListBuckets(ctx context.Context) ([]models.Bucket, error) {
	b, err := s.client.ListBuckets(ctx)
	if err != nil {
		return []models.Bucket{}, err
	}
	buckets := make([]models.Bucket, len(b))
	for i, bucket := range b {
		buckets[i] = models.Bucket{
			Name:      bucket.Name,
			CreatedAt: bucket.CreationDate,
		}
	}
	return buckets, nil
}

// BucketExists checks if a bucket exists in the cluster
func (s *Store) BucketExists(ctx context.Context, name string) (bool, error) {
	found, err := s.client.BucketExists(ctx, name)
	if err != nil {
		return false, err
	}
	return found, err
}

// RemoveBucket removes a bucket from the cluster. A non-nil error is returned if the bucket removal fails
func (s *Store) RemoveBucket(ctx context.Context, name string) error {
	return s.client.RemoveBucket(ctx, name)
}

// object operations

// GetObject retrieves an object from the specified bucket and streams it into the provided io Writer
func (s *Store) GetObject(ctx context.Context, bucketName, objectName string, writer io.Writer) error {
	object, err := s.client.GetObject(ctx, bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return err
	}
	defer object.Close()

	// stream object into the writer
	if _, err = io.Copy(writer, object); err != nil {
		return err
	}
	return nil
}

// CreateObject creates a new object and stream the content of the file read into the object
func (s *Store) CreateObject(ctx context.Context, bucketName, objectName, contentType string, size int64, fileReader io.Reader) (models.Object, error) {
	info, err := s.client.PutObject(ctx, bucketName, objectName, fileReader, size, minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return models.Object{}, err
	}

	return models.Object{Name: info.Key, Bucket: info.Bucket, Size: info.Size, Location: info.Location}, nil
}

// RemoveObject deletes a saved object from the cluster
func (s *Store) RemoveObject(ctx context.Context, bucketName, objectName string) error {
	return s.client.RemoveObject(ctx, bucketName, objectName, minio.RemoveObjectOptions{})
}

// RemoveIncompleteUpload removes an upload that was stopped midway
func (s *Store) RemoveIncompleteUploads(ctx context.Context, bucketName, objectName string) error {
	return s.client.RemoveIncompleteUpload(ctx, bucketName, objectName)

}

// TODO: add bucket notifications
