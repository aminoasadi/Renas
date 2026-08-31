-- Up to 3 optional extra images per blog post, in addition to the cover image.
CREATE TABLE "BlogPostImage" (
    "id" UUID NOT NULL,
    "blogPostId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "BlogPostImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlogPostImage_blogPostId_position_key" ON "BlogPostImage"("blogPostId", "position");

ALTER TABLE "BlogPostImage" ADD CONSTRAINT "BlogPostImage_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostImage" ADD CONSTRAINT "BlogPostImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
