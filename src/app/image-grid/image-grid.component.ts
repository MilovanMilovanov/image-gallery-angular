import {
  Component,
  OnInit,
  Renderer2,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Image {
  id: number;
  title: string;
  thumbnailUrl: string;
  largeUrl: string;
}
interface SearchTerms {
  [key: string]: string;
}

interface CategoryImages {
  [key: string]: Image[];
}

@Component({
  selector: 'app-image-grid',
  templateUrl: './image-grid.component.html',
  styleUrls: ['./image-grid.component.css'],
})
export class ImageGridComponent implements OnInit, AfterViewInit {
  categoryImages: CategoryImages = {
    animals: [],
    nature: [],
    activities: [],
  };
  filteredImages: CategoryImages = {
    ...this.categoryImages,
  };
  searchTerms: SearchTerms = {
    animals: '',
    nature: '',
    activities: '',
  };

  categoryNames: SearchTerms = {
    animals: 'Filter animal images by:',
    nature: 'Filter nature images by:',
    activities: 'Filter activity images by:',
  };

  activeTab: string = 'animals';
  searchTerm: string = '';
  placeholderText: string = 'title or keyword search';
  selectedImage: any;
  imageDialogOpen = false;

  @ViewChildren('labelsAndInputsForSearch')
  inputSearches!: QueryList<ElementRef<HTMLInputElement | HTMLLabelElement>>;

  constructor(private http: HttpClient, private renderer: Renderer2) {}

  ngOnInit() {
    this.fetchImages();
  }

  ngAfterViewInit() {
    this.setupFocusEvents();
  }

  setupFocusEvents(category?: string): void {
    let labelInputPair: ElementRef<HTMLLabelElement | HTMLInputElement>[] = [];

    if (category === 'nature') {
      labelInputPair = this.inputSearches.filter(
        (element) =>
          element.nativeElement.id === 'labelSearchNature' ||
          element.nativeElement.id === 'inputSearchNature'
      );
    } else if (category === 'activities') {
      labelInputPair = this.inputSearches.filter(
        (element) =>
          element.nativeElement.id === 'labelSearchActivities' ||
          element.nativeElement.id === 'inputSearchActivities'
      );
    } else {
      labelInputPair = this.inputSearches.filter(
        (element) =>
          element.nativeElement.id === 'labelSearchAnimals' ||
          element.nativeElement.id === 'inputSearchAnimals'
      );
    }

    labelInputPair.forEach((element) => {
      const [, input] = labelInputPair;

      this.renderer.listen(element?.nativeElement, 'mouseenter', () => {
        input?.nativeElement.focus();
      });

      this.renderer.listen(element?.nativeElement, 'mouseleave', () => {
        input?.nativeElement.blur();
      });
    });
  }

  fetchImages() {
    const apiUrl = 'https://api.pexels.com/v1/search';
    const apiKey = 'YYL3ayUaT1BE11ZCTGplqbAYtwSlfLfrbxT2jr2TbY3I8y1Q7qwXHUTq';
    const params = {
      query: this.activeTab,
      per_page: '30',
    };
    const headers = new HttpHeaders({
      Authorization: apiKey,
    });

    this.http.get<any>(apiUrl, { params, headers }).subscribe(
      (response) => {
        const images: CategoryImages = {
          animals: [],
          nature: [],
          activities: [],
        };

        response.photos.forEach((photo: any) => {
          const image: Image = {
            id: photo.id,
            title: photo.alt || '',
            thumbnailUrl: photo.src.tiny,
            largeUrl: photo.src.large,
          };

          images[this.activeTab].push(image);
        });

        this.categoryImages = images;
        this.filterImages(this.activeTab);
      },
      (error) => {
        console.error(`Error fetching images: ${error}`);
      }
    );
  }

  changeTab(category: string): void {
    this.activeTab = category;
    this.filterImages(category);

    if (this.categoryImages[category].length === 0) this.fetchImages();

    setTimeout(() => this.setupFocusEvents(category), 0);
  }

  closeTab(category: string): void {
    const tabKeys = Object.keys(this.categoryImages);
    if (tabKeys.length > 1) {
      delete this.categoryImages[category];
      this.searchTerms[category] = '';
      this.filterImages(category);
    }
  }

  filterImages(category?: string): any {
    category = category || this.activeTab;

    const searchTerm = this.searchTerms[category].toLowerCase();

    if (searchTerm === '') {
      return (this.filteredImages[category] = this.categoryImages[category]);
    }

    this.filteredImages[category] = this.categoryImages[category]?.filter(
      (image) => {
        // Some of the titles from the API have spaces at the end
        const title = image.title.toLowerCase().trim();
        return title === searchTerm || title.split(' ').includes(searchTerm);
      }
    );
  }

  openImageDialog(image: any) {
    this.selectedImage = image;
    this.imageDialogOpen = true;
  }

  closeImageDialog() {
    this.selectedImage = null;
    this.imageDialogOpen = false;
  }
}
