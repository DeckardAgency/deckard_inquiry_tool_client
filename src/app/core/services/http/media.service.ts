import { Injectable } from '@angular/core';
import { HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MediaItem } from '@core/models';
import { HydraCollection } from '@models/api/hydra-api.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
    providedIn: 'root'
})
export class MediaService extends BaseHttpService {
    private mediaItemsUrl = this.buildUrl('media_items');

    constructor() {
        super();
    }

    /**
     * Upload a file to the media API
     * @param file The file to upload
     * @returns An Observable that emits HTTP events for tracking progress
     */
    uploadFile(file: File): Observable<HttpEvent<MediaItem>> {
        // Create form data for the file upload
        const formData = new FormData();
        formData.append('file', file);

        // For file uploads, we don't set Content-Type because the browser will
        // automatically set the correct multipart/form-data Content-Type with boundary
        // We only set Accept header for JSON-LD response
        return this.http.post<MediaItem>(this.mediaItemsUrl, formData, {
            headers: this.getJsonLdHeaders().delete('Content-Type'),
            reportProgress: true,
            observe: 'events'
        });
    }

    /**
     * Get a single media item by ID
     * @param id The ID of the media item to get
     * @returns An Observable that emits the media item
     */
    getMediaItem(id: string): Observable<MediaItem> {
        return this.getWithJsonLd<MediaItem>(`${this.mediaItemsUrl}/${id}`);
    }

    /**
     * Delete a media item
     * @param id The ID of the media item to delete
     * @returns An Observable that completes when deletion is successful
     */
    deleteMediaItem(id: string): Observable<void> {
        return this.deleteWithJsonLd<void>(`${this.mediaItemsUrl}/${id}`);
    }

    /**
     * Get a collection of media items
     * @returns An Observable that emits the collection response
     */
    getMediaItems(): Observable<HydraCollection<MediaItem>> {
        return this.getWithJsonLd<HydraCollection<MediaItem>>(this.mediaItemsUrl);
    }
}
