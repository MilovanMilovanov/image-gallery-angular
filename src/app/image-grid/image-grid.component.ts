import {
  Component,
  OnInit,
  Renderer2,
  ElementRef,
  ViewChild,
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
  images: CategoryImages = {
    animals: [],
    nature: [],
    activities: [],
  };
  searchTerms: SearchTerms = {
    animals: '',
    nature: '',
    activities: '',
  };
  filteredImages: CategoryImages = {
    ...this.images,
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

  @ViewChild('inputSearchAnimals')
  inputSearchAnimals!: ElementRef<HTMLInputElement>;
  @ViewChild('labelSearchAnimals')
  labelSearchAnimals!: ElementRef<HTMLLabelElement>;
  @ViewChild('inputSearchNature')
  inputSearchNature!: ElementRef<HTMLInputElement>;
  @ViewChild('labelSearchNature')
  labelSearchNature!: ElementRef<HTMLLabelElement>;
  @ViewChild('inputSearchActivities')
  inputSearchActivities!: ElementRef<HTMLInputElement>;
  @ViewChild('labelSearchActivities')
  labelSearchActivities!: ElementRef<HTMLLabelElement>;

  constructor(private http: HttpClient, private renderer: Renderer2) {}

  ngOnInit() {
    this.fetchImages();
  }

  ngAfterViewInit() {
    this.setupFocusEvents();
  }

  setupFocusEvents(category?: string): void {
    let labelForInputSearch: HTMLLabelElement;
    let inputSearch: HTMLInputElement;

    if (category === 'nature') {
      labelForInputSearch = this.labelSearchNature.nativeElement;
      inputSearch = this.inputSearchNature.nativeElement;
    } else if (category === 'activities') {
      labelForInputSearch = this.labelSearchActivities.nativeElement;
      inputSearch = this.inputSearchActivities.nativeElement;
    } else {
      labelForInputSearch = this.labelSearchAnimals.nativeElement;
      inputSearch = this.inputSearchAnimals.nativeElement;
    }

    [labelForInputSearch, inputSearch].forEach((element) => {
      this.renderer.listen(element, 'mouseenter', () => {
        inputSearch.focus();
      });

      this.renderer.listen(element, 'mouseleave', () => {
        inputSearch.blur();
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

        this.images = images;
        this.filterImages();
      },
      (error) => {
        console.error(`Error fetching images: ${error}`);
      }
    );
  }

  changeTab(category: string): void {
    this.activeTab = category;
    this.filterImages();

    if (this.images[this.activeTab].length === 0) {
      this.fetchImages();
    }

    setTimeout(() => {
      this.setupFocusEvents(category);
    }, 0);
  }

  closeTab(tab: string): void {
    const tabKeys = Object.keys(this.images);
    if (tabKeys.length > 1) {
      delete this.images[tab];
      this.searchTerms[tab] = '';
      this.filterImages();
    }
  }

  filterImages(category?: string): void {
    const searchTerm =
      this.searchTerms[category || this.activeTab].toLowerCase();

    if (searchTerm.trim().length < 1) {
      this.filteredImages[this.activeTab] =
        this.images[category || this.activeTab];
    } else {
      this.filteredImages[category || this.activeTab] = this.images[
        category || this.activeTab
      ]?.filter((image) => {
        const title = image.title.toLowerCase();
        return title === searchTerm || title.split(' ').includes(searchTerm);
      });
    }
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
