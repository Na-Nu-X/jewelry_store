import { Pipe, PipeTransform } from '@angular/core';

import { formatDecimal, formatEur, sizedImage } from '../../core/utils/format';

@Pipe({ name: 'eur' })
export class EurPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    return formatEur(value);
  }
}

@Pipe({ name: 'decimal' })
export class DecimalSkPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    return formatDecimal(value);
  }
}

@Pipe({ name: 'sized' })
export class SizedImagePipe implements PipeTransform {
  transform(url: string | null | undefined, width: number): string {
    return sizedImage(url, width);
  }
}
