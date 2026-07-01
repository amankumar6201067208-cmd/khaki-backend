import type { Schema, Struct } from '@strapi/strapi';

export interface BlogsImage extends Struct.ComponentSchema {
  collectionName: 'components_blogs_images';
  info: {
    displayName: 'Image';
  };
  attributes: {
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface BlogsParagraph extends Struct.ComponentSchema {
  collectionName: 'components_blogs_paragraphs';
  info: {
    displayName: 'Paragraph';
  };
  attributes: {
    Paragraph: Schema.Attribute.Blocks;
  };
}

export interface HomePageInternationalImageSection
  extends Struct.ComponentSchema {
  collectionName: 'components_home_page_international_image_sections';
  info: {
    displayName: 'International Image Section';
  };
  attributes: {
    InternationalImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    InternationalImageURL: Schema.Attribute.String;
  };
}

export interface HomePageWhatSNewsSection extends Struct.ComponentSchema {
  collectionName: 'components_home_page_what_s_news_sections';
  info: {
    displayName: "What's News Section";
  };
  attributes: {
    ButtonText: Schema.Attribute.String;
    ButtonURL: Schema.Attribute.String;
    Heading: Schema.Attribute.Blocks;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    Paragraph: Schema.Attribute.Text;
  };
}

export interface PrivateToursBookingFormDetails extends Struct.ComponentSchema {
  collectionName: 'components_private_tours_booking_form_details';
  info: {
    displayName: 'Booking Form Details';
  };
  attributes: {
    BokingSlots: Schema.Attribute.Component<
      'private-tours.booking-slots',
      true
    >;
    PersonPricing: Schema.Attribute.Component<
      'private-tours.person-pricing',
      true
    >;
    TourDuraion: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

export interface PrivateToursBookingSlots extends Struct.ComponentSchema {
  collectionName: 'components_private_tours_booking_slots';
  info: {
    displayName: 'Booking Slots';
  };
  attributes: {
    EndTime: Schema.Attribute.Time;
    StartTime: Schema.Attribute.Time;
  };
}

export interface PrivateToursPersonPricing extends Struct.ComponentSchema {
  collectionName: 'components_private_tours_person_pricings';
  info: {
    displayName: 'person pricing';
  };
  attributes: {
    People: Schema.Attribute.BigInteger;
    Price: Schema.Attribute.BigInteger;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface TripHighlight extends Struct.ComponentSchema {
  collectionName: 'components_trip_highlights';
  info: {
    displayName: 'highlight';
  };
  attributes: {
    Text: Schema.Attribute.Text;
  };
}

export interface TripSchedule extends Struct.ComponentSchema {
  collectionName: 'components_trip_schedules';
  info: {
    displayName: 'schedule';
  };
  attributes: {
    Date: Schema.Attribute.Date;
    Slots: Schema.Attribute.Component<'trip.slots', true>;
  };
}

export interface TripSlots extends Struct.ComponentSchema {
  collectionName: 'components_trip_slots';
  info: {
    displayName: 'Slots';
  };
  attributes: {
    availableSeats: Schema.Attribute.BigInteger;
    Time: Schema.Attribute.Time;
  };
}

export interface TripStartingPoint extends Struct.ComponentSchema {
  collectionName: 'components_trip_starting_points';
  info: {
    displayName: 'Starting Point';
  };
  attributes: {
    location_address: Schema.Attribute.Text;
    location_name: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface WalkEventTripBookingSlots extends Struct.ComponentSchema {
  collectionName: 'components_walk_event_trip_booking_slots';
  info: {
    displayName: 'Booking Slots';
  };
  attributes: {
    Slots: Schema.Attribute.Component<'walk-event-trip.slots', false>;
    TourDate: Schema.Attribute.Date;
  };
}

export interface WalkEventTripEventStartingPoints
  extends Struct.ComponentSchema {
  collectionName: 'components_walk_event_trip_event_starting_points';
  info: {
    displayName: 'Event Starting Points';
  };
  attributes: {
    StartingPoint: Schema.Attribute.String;
  };
}

export interface WalkEventTripSlots extends Struct.ComponentSchema {
  collectionName: 'components_walk_event_trip_slots';
  info: {
    displayName: 'Slots';
  };
  attributes: {
    availableTickets: Schema.Attribute.BigInteger;
    discountUsedCount: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 3;
        },
        number
      > &
      Schema.Attribute.DefaultTo<3>;
    TourTime: Schema.Attribute.Time;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blogs.image': BlogsImage;
      'blogs.paragraph': BlogsParagraph;
      'home-page.international-image-section': HomePageInternationalImageSection;
      'home-page.what-s-news-section': HomePageWhatSNewsSection;
      'private-tours.booking-form-details': PrivateToursBookingFormDetails;
      'private-tours.booking-slots': PrivateToursBookingSlots;
      'private-tours.person-pricing': PrivateToursPersonPricing;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'trip.highlight': TripHighlight;
      'trip.schedule': TripSchedule;
      'trip.slots': TripSlots;
      'trip.starting-point': TripStartingPoint;
      'walk-event-trip.booking-slots': WalkEventTripBookingSlots;
      'walk-event-trip.event-starting-points': WalkEventTripEventStartingPoints;
      'walk-event-trip.slots': WalkEventTripSlots;
    }
  }
}
