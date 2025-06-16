package store

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/url"
	"sgs/internal/config"
	"sgs/internal/models"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/minio/minio-go/v7/pkg/notification"
)

const (
	MaxObjectPartSize = 128000000
)

// configs
var (
	useSSL = false
)

type Store struct {
	client *minio.Client
}

// New sets up a connection to the underlying minio store and initialize a client object. A non-nil error is returned when the connection fails
func New(cfg *config.Config) (*Store, error) {
	client, err := minio.New(cfg.StoreAddr, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.StoreUser, cfg.StorePassword, ""),
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

// GetNotifications returns a channel containing notifications on all objects in the underlying store
func (s *Store) GetObjectsNotifications(ctx context.Context, events []models.StoreNotificationEvent) <-chan notification.Info {
	stringEvents := make([]string, len(events))
	for i, event := range events {
		stringEvents[i] = string(event)
	}
	return s.client.ListenNotification(ctx, "", "", stringEvents)
}

// presigned urls

// GenerateTempObjectURL generates a temporal url to access an object without needing to be logged in
func (s *Store) GenerateTempObjectURL(ctx context.Context, bucket, object, downloadFilename string, expiresAt time.Duration) (*url.URL, error) {
	// set request parameters for content-disposition.
	reqParams := make(url.Values)
	reqParams.Set("response-content-disposition", fmt.Sprintf("attachment; filename=%s", downloadFilename))

	// generate presigned url
	return s.client.PresignedGetObject(context.Background(), bucket, object, expiresAt, reqParams)
}
