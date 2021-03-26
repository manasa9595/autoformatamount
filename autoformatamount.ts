import {
  NgModule,
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  AfterContentInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList,
  TemplateRef,
  Renderer2,
  forwardRef,
  ChangeDetectorRef,
  IterableDiffers,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger,
  style,
  transition,
  animate,
  AnimationEvent,
} from '@angular/animations';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { SharedModule, PrimeTemplate } from 'primeng/api';
import { DomHandler, ConnectedOverlayScrollHandler } from 'primeng/dom';
import { ObjectUtils, UniqueComponentId } from 'primeng/utils';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export const AUTOCOMPLETE_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => AutoComplete),
  multi: true,
};

@Component({
  selector: 'p-autoformat-amount',
  template: `
    <span
      #container
      [ngClass]="{
        'p-autocomplete p-component': true,
        'p-autocomplete-dd': dropdown,
        'p-autocomplete-multiple': multiple
      }"
      [ngStyle]="style"
      [class]="styleClass"
    >
      <input
        *ngIf="!multiple"
        #in
        [attr.type]="type"
        [attr.id]="inputId"
        [ngStyle]="inputStyle"
        [class]="inputStyleClass"
        [autocomplete]="autocomplete"
        [attr.required]="required"
        [attr.name]="name"
        class="p-autocomplete-input p-inputtext p-component"
        [ngClass]="{
          'p-autocomplete-dd-input': dropdown,
          'p-disabled': disabled
        }"
        [value]="formattedValue()"
        aria-autocomplete="list"
        [attr.aria-controls]="listId"
        role="searchbox"
        [attr.aria-expanded]="overlayVisible"
        aria-haspopup="true"
        [attr.aria-activedescendant]="'p-highlighted-option'"
        (click)="onInputClick($event)"
        (input)="onUserInput($event);onInputKeyPress($event);onInputEnter($event);"
        (keydown)="onKeydown($event)"
        (keyup)="onKeyup($event)"
        (keypress)="onUserInput($event);onInputKeyPress($event);onInputEnter($event);"
        [attr.autofocus]="autofocus"
        (focus)="onInputFocus($event)"
        (blur)="onInputBlur($event)"
        (change)="onInputChange($event)"
        (paste)="onInputPaste($event)"
        [attr.placeholder]="placeholder"
        [attr.size]="size"
        [attr.maxlength]="maxlength"
        [attr.tabindex]="tabindex"
        [readonly]="readonly"
        [disabled]="disabled"
        [attr.aria-label]="ariaLabel"
        [attr.aria-labelledby]="ariaLabelledBy"
        [attr.aria-required]="required"
      />
      <ul
        *ngIf="multiple"
        #multiContainer
        class="p-autocomplete-multiple-container p-component p-inputtext"
        [ngClass]="{ 'p-disabled': disabled, 'p-focus': focus }"
        (click)="multiIn.focus()"
      >
        <li #token *ngFor="let val of value" class="p-autocomplete-token">
          <ng-container
            *ngTemplateOutlet="
              selectedItemTemplate;
              context: { $implicit: val }
            "
          ></ng-container>
          <span
            *ngIf="!selectedItemTemplate"
            class="p-autocomplete-token-label"
            >{{ resolveFieldData(val) }}</span
          >
          <span
            class="p-autocomplete-token-icon pi pi-times-circle"
            (click)="removeItem(token)"
            *ngIf="!disabled && !readonly"
          ></span>
        </li>
        <li class="p-autocomplete-input-token">
          <input
            #multiIn
            [attr.type]="type"
            [attr.id]="inputId"
            [disabled]="disabled"
            [attr.placeholder]="value && value.length ? null : placeholder"
            [attr.tabindex]="tabindex"
            [attr.maxlength]="maxlength"
            (input)="onUserInput($event);onInputKeyPress($event);onInputEnter($event);"
            (keypress)="onUserInput($event);onInputKeyPress($event);onInputEnter($event);"
            (click)="onInputClick($event)"
            (keydown)="onKeydown($event)"
            [readonly]="readonly"
            (keyup)="onKeyup($event)"
            [attr.autofocus]="autofocus"
            (focus)="onInputFocus($event)"
            (blur)="onInputBlur($event)"
            (change)="onInputChange($event)"
            (paste)="onInputPaste($event)"
            [autocomplete]="autocomplete"
            [ngStyle]="inputStyle"
            [class]="inputStyleClass"
            [attr.aria-label]="ariaLabel"
            [attr.aria-labelledby]="ariaLabelledBy"
            [attr.aria-required]="required"
            aria-autocomplete="list"
            [attr.aria-controls]="listId"
            role="searchbox"
            [attr.aria-expanded]="overlayVisible"
            aria-haspopup="true"
            [attr.aria-activedescendant]="'p-highlighted-option'"
          />
        </li>
      </ul>
      <i *ngIf="loading" class="p-autocomplete-loader pi pi-spinner pi-spin"></i
      ><button
        #ddBtn
        type="button"
        pButton
        [icon]="dropdownIcon"
        class="p-autocomplete-dropdown"
        [disabled]="disabled"
        pRipple
        (click)="handleDropdownClick($event)"
        *ngIf="dropdown"
        [attr.tabindex]="tabindex"
      ></button>
      <div
        #panel
        *ngIf="overlayVisible"
        [ngClass]="['p-autocomplete-panel p-component']"
        [style.max-height]="scrollHeight"
        [ngStyle]="panelStyle"
        [class]="panelStyleClass"
        [@overlayAnimation]="{
          value: 'visible',
          params: {
            showTransitionParams: showTransitionOptions,
            hideTransitionParams: hideTransitionOptions
          }
        }"
        (@overlayAnimation.start)="onOverlayAnimationStart($event)"
      >
        <ul role="listbox" [attr.id]="listId" class="p-autocomplete-items">
          <ng-container *ngIf="group">
            <ng-template ngFor let-optgroup [ngForOf]="suggestions">
              <li class="p-autocomplete-item-group">
                <span *ngIf="!groupTemplate">{{
                  getOptionGroupLabel(optgroup) || 'empty'
                }}</span>
                <ng-container
                  *ngTemplateOutlet="
                    groupTemplate;
                    context: { $implicit: optgroup }
                  "
                ></ng-container>
              </li>
              <ng-container
                *ngTemplateOutlet="
                  itemslist;
                  context: { $implicit: getOptionGroupChildren(optgroup) }
                "
              ></ng-container>
            </ng-template>
          </ng-container>
          <ng-container *ngIf="!group">
            <ng-container
              *ngTemplateOutlet="itemslist; context: { $implicit: suggestions }"
            ></ng-container>
          </ng-container>
          <ng-template #itemslist let-suggestionsToDisplay>
            <li
              role="option"
              *ngFor="let option of suggestionsToDisplay; let idx = index"
              class="p-autocomplete-item"
              pRipple
              [ngClass]="{ 'p-highlight': option === highlightOption }"
              [id]="highlightOption == option ? 'p-highlighted-option' : ''"
              (click)="selectItem(option)"
            >
              <span *ngIf="!itemTemplate">{{ resolveFieldData(option) }}</span>
              <ng-container
                *ngTemplateOutlet="
                  itemTemplate;
                  context: { $implicit: option, index: idx }
                "
              ></ng-container>
            </li>
            <li
              *ngIf="noResults && emptyMessage"
              class="p-autocomplete-emptymessage p-autocomplete-item"
            >
              {{ emptyMessage }}
            </li>
          </ng-template>
        </ul>
      </div>
    </span>
  `,
  animations: [
    trigger('overlayAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scaleY(0.8)' }),
        animate('{{showTransitionParams}}'),
      ]),
      transition(':leave', [
        animate('{{hideTransitionParams}}', style({ opacity: 0 })),
      ]),
    ]),
  ],
  host: {
    '[class.p-inputwrapper-filled]': 'filled',
    '[class.p-inputwrapper-focus]': '(focus && !disabled) || overlayVisible',
  },
  providers: [AUTOCOMPLETE_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./autoformatamount.css'],
})
export class AutoComplete
  implements
    AfterViewChecked,
    AfterContentInit,
    OnDestroy,
    ControlValueAccessor {
  groupChar: string = '';

  prefixChar: string = '';

  suffixChar: string = '';
  @Output() onInput: EventEmitter<any> = new EventEmitter();
  isSpecialChar: boolean;
  @Input() minLength: number = 1;

  @Input() delay: number = 300;

  @Input() style: any;

  @Input() panelStyle: any;

  @Input() styleClass: string;

  @Input() panelStyleClass: string;

  @Input() inputStyle: any;

  @Input() inputId: string;

  @Input() inputStyleClass: string;

  @Input() placeholder: string;

  @Input() readonly: boolean;

  @Input() disabled: boolean;

  @Input() maxlength: number;

  @Input() name: string;

  @Input() required: boolean;

  @Input() size: number;

  @Input() appendTo: any;

  @Input() autoHighlight: boolean;

  @Input() forceSelection: boolean;

  @Input() type: string = 'text';

  @Input() autoZIndex: boolean = true;

  @Input() baseZIndex: number = 0;

  @Input() ariaLabel: string;

  @Input() ariaLabelledBy: string;

  @Input() dropdownIcon: string = 'pi pi-chevron-down';

  @Input() unique: boolean = true;

  @Input() group: boolean;

  @Input() completeOnFocus: boolean = false;

  @Output() completeMethod: EventEmitter<any> = new EventEmitter();

  @Output() onSelect: EventEmitter<any> = new EventEmitter();

  @Output() onUnselect: EventEmitter<any> = new EventEmitter();

  @Output() onFocus: EventEmitter<any> = new EventEmitter();

  @Output() onBlur: EventEmitter<any> = new EventEmitter();

  @Output() onDropdownClick: EventEmitter<any> = new EventEmitter();

  @Output() onClear: EventEmitter<any> = new EventEmitter();

  @Output() onKeyUp: EventEmitter<any> = new EventEmitter();

  @Output() onShow: EventEmitter<any> = new EventEmitter();

  @Output() onHide: EventEmitter<any> = new EventEmitter();

  @Input() field: string;

  @Input() scrollHeight: string = '200px';

  @Input() dropdown: boolean;

  @Input() dropdownMode: string = 'blank';

  @Input() multiple: boolean;

  @Input() tabindex: number;

  @Input() dataKey: string;

  @Input() emptyMessage: string;

  @Input() step: number = 1;

  @Input() showTransitionOptions: string = '.12s cubic-bezier(0, 0, 0.2, 1)';

  @Input() hideTransitionOptions: string = '.1s linear';

  @Input() autofocus: boolean;

  @Input() autocomplete: string = 'off';

  @Input() optionGroupChildren: string;

  @Input() optionGroupLabel: string;

  @ViewChild('container') containerEL: ElementRef;

  @ViewChild('in') inputEL: ElementRef;

  @ViewChild('multiIn') multiInputEL: ElementRef;

  @ViewChild('multiContainer') multiContainerEL: ElementRef;

  @ViewChild('ddBtn') dropdownButton: ElementRef;

  @ViewChild('in') input: ElementRef;

  @ContentChildren(PrimeTemplate) templates: QueryList<any>;

  overlay: HTMLDivElement;

  itemTemplate: TemplateRef<any>;

  selectedItemTemplate: TemplateRef<any>;

  groupTemplate: TemplateRef<any>;

  value: any;

  onModelChange: Function = () => {};

  onModelTouched: Function = () => {};

  timeout: any;

  overlayVisible: boolean = false;

  documentClickListener: any;

  suggestionsUpdated: boolean;

  highlightOption: any;

  @Input() min: number;

  @Input() max: number;

  highlightOptionChanged: boolean;

  focus: boolean = false;

  filled: boolean;

  inputClick: boolean;

  inputKeyDown: boolean;

  noResults: boolean;

  differ: any;

  inputFieldValue: string = null;

  loading: boolean;

  scrollHandler: any;

  documentResizeListener: any;

  forceSelectionUpdateModelTimeout: any;

  listId: string;
  _decimal: any;

  _group: any;

  _minusSign: any;

  _currency: any;

  _prefix: any;

  _suffix: any;

  _index: any;
  itemClicked: boolean;
  lastValue: string;
  _suggestions: any[];
  numberFormat: Intl.NumberFormat;
  private _localeOption: string;
  private _localeMatcherOption: string;
  initialized: any;
  private _modeOption: string;
  private _currencyOption: string;
  private _currencyDisplayOption: string;
  private _useGroupingOption: boolean;
  private _minFractionDigitsOption: number;
  _maxFractionDigitsOption: number;
  private _prefixOption: string;
  private _suffixOption: string;
  private _numeral: RegExp;
  @Input() format: boolean = true;
  @Input() get suggestions(): any[] {
    return this._suggestions;
  }

  set suggestions(val: any[]) {
    this._suggestions = val;
    this.handleSuggestionsChange();
  }
  @Input() get locale(): string {
    return this._localeOption;
  }

  set locale(localeOption: string) {
    this._localeOption = localeOption;
    this.updateConstructParser();
  }

  @Input() get localeMatcher(): string {
    return this._localeMatcherOption;
  }

  set localeMatcher(localeMatcherOption: string) {
    this._localeMatcherOption = localeMatcherOption;
    this.updateConstructParser();
  }

  @Input() get mode(): string {
    return this._modeOption;
  }
  updateConstructParser() {
    if (this.initialized) {
      this.constructParser();
    }
  }
  set mode(modeOption: string) {
    this._modeOption = modeOption;
    this.updateConstructParser();
  }

  @Input() get currency(): string {
    return this._currencyOption;
  }

  set currency(currencyOption: string) {
    this._currencyOption = currencyOption;
    this.updateConstructParser();
  }

  @Input() get currencyDisplay(): string {
    return this._currencyDisplayOption;
  }

  set currencyDisplay(currencyDisplayOption: string) {
    this._currencyDisplayOption = currencyDisplayOption;
    this.updateConstructParser();
  }

  @Input() get useGrouping(): boolean {
    return this._useGroupingOption;
  }

  set useGrouping(useGroupingOption: boolean) {
    this._useGroupingOption = useGroupingOption;
    this.updateConstructParser();
  }

  @Input() get minFractionDigits(): number {
    return this._minFractionDigitsOption;
  }

  set minFractionDigits(minFractionDigitsOption: number) {
    this._minFractionDigitsOption = minFractionDigitsOption;
    this.updateConstructParser();
  }

  @Input() get maxFractionDigits(): number {
    return this._maxFractionDigitsOption;
  }

  set maxFractionDigits(maxFractionDigitsOption: number) {
    this._maxFractionDigitsOption = maxFractionDigitsOption;
    this.updateConstructParser();
  }

  @Input() get prefix(): string {
    return this._prefixOption;
  }

  set prefix(prefixOption: string) {
    this._prefixOption = prefixOption;
    this.updateConstructParser();
  }

  @Input() get suffix(): string {
    return this._suffixOption;
  }

  set suffix(suffixOption: string) {
    this._suffixOption = suffixOption;
    this.updateConstructParser();
  }

  constructor(
    public el: ElementRef,
    public renderer: Renderer2,
    public cd: ChangeDetectorRef,
    public differs: IterableDiffers
  ) {
    this.differ = differs.find([]).create(null);
    this.listId = UniqueComponentId() + '_list';
  }

  getOptions() {
    return {
      localeMatcher: this.localeMatcher,
      style: this.mode,
      currency: this.currency,
      currencyDisplay: this.currencyDisplay,
      useGrouping: this.useGrouping,
      minimumFractionDigits: this.minFractionDigits,
      maximumFractionDigits: this.maxFractionDigits,
    };
  }
  ngOnInit() {
    this.constructParser();
    this.initialized = true;
  }

  ngAfterViewChecked() {
    //Use timeouts as since Angular 4.2, AfterViewChecked is broken and not called after panel is updated
    if (this.suggestionsUpdated && this.overlay && this.overlay.offsetParent) {
      setTimeout(() => {
        if (this.overlay) {
          this.alignOverlay();
        }
      }, 1);
      this.suggestionsUpdated = false;
    }

    if (this.highlightOptionChanged) {
      setTimeout(() => {
        if (this.overlay) {
          let listItem = DomHandler.findSingle(this.overlay, 'li.p-highlight');
          if (listItem) {
            DomHandler.scrollInView(this.overlay, listItem);
          }
        }
      }, 1);
      this.highlightOptionChanged = false;
    }
  }

  handleSuggestionsChange() {
    if (this._suggestions != null && this.loading) {
      this.highlightOption = null;
      if (this._suggestions.length) {
        this.noResults = false;
        this.show();
        this.suggestionsUpdated = true;

        if (this.autoHighlight) {
          this.highlightOption = this._suggestions[0];
        }
      } else {
        this.noResults = true;

        if (this.emptyMessage) {
          this.show();
          this.suggestionsUpdated = true;
        } else {
          this.hide();
        }
      }

      this.loading = false;
    }
  }

  ngAfterContentInit() {
    this.templates.forEach((item) => {
      switch (item.getType()) {
        case 'item':
          this.itemTemplate = item.template;
          break;

        case 'group':
          this.groupTemplate = item.template;
          break;

        case 'selectedItem':
          this.selectedItemTemplate = item.template;
          break;

        default:
          this.itemTemplate = item.template;
          break;
      }
    });
  }

  writeValue(value: any): void {
    this.value = value;
    this.filled = this.value && this.value != '';
    this.updateInputField();
    this.cd.markForCheck();
  }

  getOptionGroupChildren(optionGroup: any) {
    return this.optionGroupChildren
      ? ObjectUtils.resolveFieldData(optionGroup, this.optionGroupChildren)
      : optionGroup.items;
  }

  getOptionGroupLabel(optionGroup: any) {
    return this.optionGroupLabel
      ? ObjectUtils.resolveFieldData(optionGroup, this.optionGroupLabel)
      : optionGroup.label != undefined
      ? optionGroup.label
      : optionGroup;
  }

  registerOnChange(fn: Function): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: Function): void {
    this.onModelTouched = fn;
  }

  setDisabledState(val: boolean): void {
    this.disabled = val;
    this.cd.markForCheck();
  }

  removeCommaSeperator(string) {
    // return status;
    if (typeof string !== 'number') {
      return string?.replace(/,/g, '')?.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    } else return string;
  }
  onUserInput(event) {
    if (this.isSpecialChar) {
        event.target.value = this.lastValue;
    }
    this.isSpecialChar = false;
}
  onInputEnter(event: Event) {
    let input = (<HTMLInputElement>event.target).value;
    let value = this.formatValue(input);
    if (this.isSpecialChar) {
      input = this.lastValue;
    } else {
      // When an input element with a placeholder is clicked, the onInput event is invoked in IE.
      if (!this.inputKeyDown && DomHandler.isIE()) {
        return;
      }

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      if (!this.multiple && !this.forceSelection) {
        this.onModelChange(value);
      }

      if (value.length === 0 && !this.multiple) {
        this.hide();
        this.onClear.emit(event);
        this.onModelChange(value);
      }

      if (value.length >= this.minLength) {
        this.timeout = setTimeout(() => {
          this.search(event, value);
        }, this.delay);
      } else {
        this.hide();
      }
      this.updateFilledState();
      this.inputKeyDown = false;
    }
    this.isSpecialChar = false;
  }

  onInputClick(event: MouseEvent) {
    if (this.documentClickListener) {
      this.inputClick = true;
    }
  }

  search(event: any, query: string) {
    //allow empty string but not undefined or null
    if (query === undefined || query === null) {
      return;
    }

    this.loading = true;

    this.completeMethod.emit({
      originalEvent: event,
      // query: query,
      query: this.formatValue(query),
    });
  }

  selectItem(option: any, focus: boolean = true) {
    if (this.forceSelectionUpdateModelTimeout) {
      clearTimeout(this.forceSelectionUpdateModelTimeout);
      this.forceSelectionUpdateModelTimeout = null;
    }

    if (this.multiple) {
      this.multiInputEL.nativeElement.value = '';
      this.value = this.value || [];
      if (!this.isSelected(option) || !this.unique) {
        this.value = [...this.value, option.value];
        this.onModelChange(this.value);
      }
    } else {
      this.inputEL.nativeElement.value = this.resolveFieldData(option);
      this.value = option.value;
      this.onModelChange(this.value);
    }

    let value = option && this.formatValue(option.value);
    this.onSelect.emit(value);
    this.updateFilledState();

    if (focus) {
      this.itemClicked = true;
      this.focusInput();
    }
  }

  show() {
    if (this.multiInputEL || this.inputEL) {
      let hasFocus = this.multiple
        ? this.multiInputEL.nativeElement.ownerDocument.activeElement ==
          this.multiInputEL.nativeElement
        : this.inputEL.nativeElement.ownerDocument.activeElement ==
          this.inputEL.nativeElement;

      if (!this.overlayVisible && hasFocus) {
        this.overlayVisible = true;
      }
    }
  }

  onOverlayAnimationStart(event: AnimationEvent) {
    switch (event.toState) {
      case 'visible':
        this.overlay = event.element;
        this.appendOverlay();
        if (this.autoZIndex) {
          this.overlay.style.zIndex = String(
            this.baseZIndex + ++DomHandler.zindex
          );
        }
        this.alignOverlay();
        this.bindDocumentClickListener();
        this.bindDocumentResizeListener();
        this.bindScrollListener();
        this.onShow.emit(event);
        break;

      case 'void':
        this.onOverlayHide();
        break;
    }
  }

  appendOverlay() {
    if (this.appendTo) {
      if (this.appendTo === 'body') document.body.appendChild(this.overlay);
      else DomHandler.appendChild(this.overlay, this.appendTo);

      if (!this.overlay.style.minWidth) {
        this.overlay.style.minWidth =
          DomHandler.getWidth(this.el.nativeElement.children[0]) + 'px';
      }
    }
  }

  resolveFieldData(value) {
    let data = this.field
      ? (ObjectUtils.resolveFieldData(value, this.field) || value)
      : value;
    return data !== (null || undefined) ? data : '';
  }

  restoreOverlayAppend() {
    if (this.overlay && this.appendTo) {
      this.el.nativeElement.appendChild(this.overlay);
    }
  }

  alignOverlay() {
    if (this.appendTo)
      DomHandler.absolutePosition(
        this.overlay,
        this.multiple
          ? this.multiContainerEL.nativeElement
          : this.inputEL.nativeElement
      );
    else
      DomHandler.relativePosition(
        this.overlay,
        this.multiple
          ? this.multiContainerEL.nativeElement
          : this.inputEL.nativeElement
      );
  }

  hide() {
    this.overlayVisible = false;
    this.cd.markForCheck();
  }

  handleDropdownClick(event) {
    if (!this.overlayVisible) {
      this.focusInput();
      let queryValue = this.multiple
        ? this.multiInputEL.nativeElement.value
        : this.inputEL.nativeElement.value;

      if (this.dropdownMode === 'blank') this.search(event, '');
      else if (this.dropdownMode === 'current') this.search(event, queryValue);

      this.onDropdownClick.emit({
        originalEvent: event,
        query: queryValue,
      });
    } else {
      this.hide();
    }
  }

  focusInput() {
    if (this.multiple) this.multiInputEL.nativeElement.focus();
    else this.inputEL.nativeElement.focus();
  }

  removeItem(item: any) {
    let itemIndex = DomHandler.index(item);
    let removedValue = this.value[itemIndex];
    this.value = this.value.filter((val, i) => i != itemIndex);
    this.onModelChange(this.value);
    this.updateFilledState();
    this.onUnselect.emit(removedValue);
  }

  onKeydown(event) {
    if (this.overlayVisible) {
      this.lastValue = event.target.value;
      if (event.shiftKey || event.altKey) {
        this.isSpecialChar = true;
        return;
      }

      let selectionStart = event.target.selectionStart;
      let selectionEnd = event.target.selectionEnd;
      let inputValue = event.target.value;
      let newValueStr = null;

      if (event.altKey) {
        event.preventDefault();
      }
      switch (event.which) {
        //down
        case 40:
          if(inputValue)
          if (this.group) {
            let highlightItemIndex = this.findOptionGroupIndex(
              this.highlightOption,
              this.suggestions
            );

            if (highlightItemIndex !== -1) {
              let nextItemIndex = highlightItemIndex.itemIndex + 1;
              if (
                nextItemIndex <
                this.getOptionGroupChildren(
                  this.suggestions[highlightItemIndex.groupIndex]
                ).length
              ) {
                this.highlightOption = this.getOptionGroupChildren(
                  this.suggestions[highlightItemIndex.groupIndex]
                )[nextItemIndex];
                this.highlightOptionChanged = true;
              } else if (this.suggestions[highlightItemIndex.groupIndex + 1]) {
                this.highlightOption = this.getOptionGroupChildren(
                  this.suggestions[highlightItemIndex.groupIndex + 1]
                )[0];
                this.highlightOptionChanged = true;
              }
            } else {
              this.highlightOption = this.getOptionGroupChildren(
                this.suggestions[0]
              )[0];
            }
          } else {
            let highlightItemIndex = this.findOptionIndex(
              this.highlightOption,
              this.suggestions
            );

            if (highlightItemIndex != -1) {
              var nextItemIndex = highlightItemIndex + 1;
              if (nextItemIndex != this.suggestions.length) {
                this.highlightOption = this.suggestions[nextItemIndex];
                this.highlightOptionChanged = true;
              }
            } else {
              this.highlightOption = this.suggestions[0];
            }
          }

          event.preventDefault();
          break;

        //up
        case 38:
          if(inputValue)
          if (this.group) {
            let highlightItemIndex = this.findOptionGroupIndex(
              this.highlightOption,
              this.suggestions
            );
            if (highlightItemIndex !== -1) {
              let prevItemIndex = highlightItemIndex.itemIndex - 1;
              if (prevItemIndex >= 0) {
                this.highlightOption = this.getOptionGroupChildren(
                  this.suggestions[highlightItemIndex.groupIndex]
                )[prevItemIndex];
                this.highlightOptionChanged = true;
              } else if (prevItemIndex < 0) {
                let prevGroup = this.suggestions[
                  highlightItemIndex.groupIndex - 1
                ];
                if (prevGroup) {
                  this.highlightOption = this.getOptionGroupChildren(prevGroup)[
                    this.getOptionGroupChildren(prevGroup).length - 1
                  ];
                  this.highlightOptionChanged = true;
                }
              }
            }
          } else {
            let highlightItemIndex = this.findOptionIndex(
              this.highlightOption,
              this.suggestions
            );

            if (highlightItemIndex > 0) {
              let prevItemIndex = highlightItemIndex - 1;
              this.highlightOption = this.suggestions[prevItemIndex];
              this.highlightOptionChanged = true;
            } else {
              this.highlightOption = this.suggestions[0];
            }
          }

          event.preventDefault();
          break;

        //enter
        case 13:
          if (this.highlightOption) {
            this.selectItem(this.highlightOption.value);
            this.hide();
            let newValue = this.validateValue(
              this.parseValue(this.highlightOption.value)
            );
            this.input.nativeElement.value = this.formatValue(newValue);
            this.input.nativeElement.setAttribute('aria-valuenow', newValue);
            this.updateModel(event, newValue);
          }
          event.preventDefault();
          break;

        //escape
        case 27:
          this.hide();
          event.preventDefault();
          break;

        //tab
        case 9:
          if (this.highlightOption) {
            this.selectItem(this.highlightOption);
          }
          this.hide();
          break;

        //backspace
        case 8: {
          this.hide();
          event.preventDefault();

          if (selectionStart === selectionEnd) {
            let deleteChar = inputValue.charAt(selectionStart - 1);
            let decimalCharIndex = inputValue.search(this._decimal);
            this._decimal.lastIndex = 0;

            if (this.isNumeralChar(deleteChar)) {
              if (this._group.test(deleteChar)) {
                this._group.lastIndex = 0;
                newValueStr =
                  inputValue.slice(0, selectionStart - 2) +
                  inputValue.slice(selectionStart - 1);
              } else if (this._decimal.test(deleteChar)) {
                this._decimal.lastIndex = 0;
                this.input.nativeElement.setSelectionRange(
                  selectionStart - 1,
                  selectionStart - 1
                );
              } else if (
                decimalCharIndex > 0 &&
                selectionStart > decimalCharIndex
              ) {
                newValueStr =
                  inputValue.slice(0, selectionStart - 1) +
                  '0' +
                  inputValue.slice(selectionStart);
              } else if (decimalCharIndex > 0 && decimalCharIndex === 1) {
                newValueStr =
                  inputValue.slice(0, selectionStart - 1) +
                  '0' +
                  inputValue.slice(selectionStart);
                newValueStr =
                  this.parseValue(newValueStr) > 0 ? newValueStr : '';
              } else {
                newValueStr =
                  inputValue.slice(0, selectionStart - 1) +
                  inputValue.slice(selectionStart);
              }
            }

            this.updateValue(event, newValueStr, null, 'delete-single');
          } else {
            newValueStr = this.deleteRange(
              inputValue,
              selectionStart,
              selectionEnd
            );
            this.updateValue(event, newValueStr, null, 'delete-range');
          }

          break;
        }

        //delete
        case 46:
          this.hide();
          event.preventDefault();

          if (selectionStart === selectionEnd) {
            let deleteChar = inputValue.charAt(selectionStart);
            let decimalCharIndex = inputValue.search(this._decimal);
            this._decimal.lastIndex = 0;

            if (this.isNumeralChar(deleteChar)) {
              if (this._group.test(deleteChar)) {
                this._group.lastIndex = 0;
                newValueStr =
                  inputValue.slice(0, selectionStart) +
                  inputValue.slice(selectionStart + 2);
              } else if (this._decimal.test(deleteChar)) {
                this._decimal.lastIndex = 0;
                this.input.nativeElement.setSelectionRange(
                  selectionStart + 1,
                  selectionStart + 1
                );
              } else if (
                decimalCharIndex > 0 &&
                selectionStart > decimalCharIndex
              ) {
                newValueStr =
                  inputValue.slice(0, selectionStart) +
                  '0' +
                  inputValue.slice(selectionStart + 1);
              } else if (decimalCharIndex > 0 && decimalCharIndex === 1) {
                newValueStr =
                  inputValue.slice(0, selectionStart) +
                  '0' +
                  inputValue.slice(selectionStart + 1);
                newValueStr =
                  this.parseValue(newValueStr) > 0 ? newValueStr : '';
              } else {
                newValueStr =
                  inputValue.slice(0, selectionStart) +
                  inputValue.slice(selectionStart + 1);
              }
            }

            this.updateValue(event, newValueStr, null, 'delete-back-single');
          } else {
            newValueStr = this.deleteRange(
              inputValue,
              selectionStart,
              selectionEnd
            );
            this.updateValue(event, newValueStr, null, 'delete-range');
          }
          break;

        default:
          break;
      }
    } else {
      if (event.which === 40 && this.suggestions) {
        this.search(event, event.target.value);
      }
    }

    if (this.multiple) {
      switch (event.which) {
        //backspace
        case 8:
          if (
            this.value &&
            this.value.length &&
            !this.multiInputEL.nativeElement.value
          ) {
            this.value = [...this.value];
            const removedValue = this.value.pop();
            this.onModelChange(this.value);
            this.updateFilledState();
            this.onUnselect.emit(removedValue);
          }
          break;
      }
    }

    this.inputKeyDown = true;
  }

  onKeyup(event) {
    this.onKeyUp.emit(event);
  }
  updateValue(event, valueStr, insertedValueStr, operation) {
    let currentValue = this.input.nativeElement.value;
    let newValue = null;

    if (valueStr != null) {
      newValue = this.parseValue(valueStr);
      this.updateInput(newValue, insertedValueStr, operation);
    }

    this.handleOnInput(event, currentValue, newValue);
  }
  onInputKeyPress(event) {
    event.preventDefault();
    let code = event.which || event.keyCode;
    let char = String.fromCharCode(code);
    const isDecimalSign = this.isDecimalSign(char);
    const isMinusSign = this.isMinusSign(char);

    if ((48 <= code && code <= 57) || isMinusSign || isDecimalSign) {
        this.insert(event, char, { isDecimalSign, isMinusSign });
    }
  }
isMinusSign(char) {
  if (this._minusSign.test(char)) {
      this._minusSign.lastIndex = 0;
      return true;
  }

  return false;
}

isDecimalSign(char) {
  if (this._decimal.test(char)) {
      this._decimal.lastIndex = 0;
      return true;
  }

  return false;
}
  onPaste(event) {
    if (!this.disabled) {
        event.preventDefault();
        let data = (event.clipboardData || window['clipboardData']).getData('Text');
        if (data) {
            let filteredData = this.parseValue(data);
            if (filteredData != null) {
                this.insert(event, filteredData.toString());
            }
        }
    }
}
insert(event, text, sign = { isDecimalSign: false, isMinusSign: false }) {
  let selectionStart = this.input.nativeElement.selectionStart;
  let selectionEnd = this.input.nativeElement.selectionEnd;
  let inputValue = this.input.nativeElement.value.trim();
  const decimalCharIndex = inputValue.search(this._decimal);
  this._decimal.lastIndex = 0;
  const minusCharIndex = inputValue.search(this._minusSign);
  this._minusSign.lastIndex = 0;
  let newValueStr;

  if (sign.isMinusSign) {
      if (selectionStart === 0) {
          newValueStr = inputValue;
          if (minusCharIndex === -1 || selectionEnd !== 0) {
              newValueStr = this.insertText(inputValue, text, 0, selectionEnd);
          }

          this.updateValue(event, newValueStr, text, 'insert');
      }
  }
  else if (sign.isDecimalSign) {
      if (decimalCharIndex > 0 && selectionStart === decimalCharIndex) {
          this.updateValue(event, inputValue, text, 'insert');
      }
      else if (decimalCharIndex > selectionStart && decimalCharIndex < selectionEnd) {
          newValueStr = this.insertText(inputValue, text, selectionStart, selectionEnd);
          this.updateValue(event, newValueStr, text, 'insert');
      }
  }
  else {
      const maxFractionDigits = this.numberFormat.resolvedOptions().maximumFractionDigits;
      const operation = selectionStart !== selectionEnd ? 'range-insert' : 'insert';

      if (decimalCharIndex > 0 && selectionStart > decimalCharIndex) {
          if ((selectionStart + text.length - (decimalCharIndex + 1)) <= maxFractionDigits) {
              newValueStr = inputValue.slice(0, selectionStart) + text + inputValue.slice(selectionStart + text.length);
              this.updateValue(event, newValueStr, text, operation);
          }
      }
      else {
          newValueStr = this.insertText(inputValue, text, selectionStart, selectionEnd);
          this.updateValue(event, newValueStr, text, operation);
      }
  }
}

insertText(value, text, start, end) {
  let textSplit = text.split('.');

  if (textSplit.length == 2) {
      const decimalCharIndex = value.slice(start, end).search(this._decimal);
      this._decimal.lastIndex = 0;
      return (decimalCharIndex > 0) ? value.slice(0, start) + this.formatValue(text) + value.slice(end) : (value || this.formatValue(text));
  }
  else if ((end - start) === value.length) {
      return this.formatValue(text);
  }
  else if (start === 0) {
      return text + value.slice(end);
  }
  else if (end === value.length) {
      return value.slice(0, start) + text;
  }
  else {
      return value.slice(0, start) + text + value.slice(end);
  }
}

  deleteRange(value, start, end) {
    let newValueStr;

    if (end - start === value.length) newValueStr = '';
    else if (start === 0) newValueStr = value.slice(end);
    else if (end === value.length) newValueStr = value.slice(0, start);
    else newValueStr = value.slice(0, start) + value.slice(end);

    return newValueStr;
  }

  onInputFocus(event) {
    if (!this.itemClicked && this.completeOnFocus) {
      let queryValue = this.multiple
        ? this.multiInputEL.nativeElement.value
        : this.inputEL.nativeElement.value;
      this.search(event, queryValue);
    }

    this.focus = true;
    this.onFocus.emit(event);
    this.itemClicked = false;
  }

  onInputBlur(event) {
    this.focus = false;
    this.onModelTouched();

    let newValue = this.validateValue(this.parseValue(this.input.nativeElement.value));
    this.input.nativeElement.value = this.formatValue(newValue);
    this.input.nativeElement.setAttribute('aria-valuenow', newValue);
    this.updateModel(event, newValue);

    this.onBlur.emit(event);
  }

  onInputChange(event) {
    if (this.forceSelection) {
      let valid = false;
      let inputValue = event.target.value.trim();

      if (this.suggestions) {
        for (let suggestion of this.suggestions) {
          let itemValue = this.field
            ? ObjectUtils.resolveFieldData(suggestion, this.field)
            : suggestion;
          if (itemValue && inputValue === itemValue.trim()) {
            valid = true;
            this.forceSelectionUpdateModelTimeout = setTimeout(() => {
              this.selectItem(suggestion, false);
            }, 250);
            break;
          }
        }
      }

      if (!valid) {
        if (this.multiple) {
          this.multiInputEL.nativeElement.value = '';
        } else {
          this.value = null;
          this.inputEL.nativeElement.value = '';
        }

        this.onClear.emit(event);
        this.onModelChange(this.value);
        this.updateFilledState();
      }
    }
  }

  onInputPaste(event: ClipboardEvent) {
    this.onKeydown(event);
    this.onPaste(event);
  }

  isSelected(val: any): boolean {
    let selected: boolean = false;
    if (this.value && this.value.length) {
      for (let i = 0; i < this.value.length; i++) {
        if (ObjectUtils.equals(this.value[i], val, this.dataKey)) {
          selected = true;
          break;
        }
      }
    }
    return selected;
  }

  findOptionIndex(option, suggestions): number {
    let index: number = -1;
    if (suggestions) {
      for (let i = 0; i < suggestions.length; i++) {
        if (ObjectUtils.equals(option, suggestions[i])) {
          index = i;
          break;
        }
      }
    }

    return index;
  }

  findOptionGroupIndex(val: any, opts: any[]): any {
    let groupIndex, itemIndex;

    if (opts) {
      for (let i = 0; i < opts.length; i++) {
        groupIndex = i;
        itemIndex = this.findOptionIndex(
          val,
          this.getOptionGroupChildren(opts[i])
        );

        if (itemIndex !== -1) {
          break;
        }
      }
    }

    if (itemIndex !== -1) {
      return { groupIndex: groupIndex, itemIndex: itemIndex };
    } else {
      return -1;
    }
  }

  updateFilledState() {
    if (this.multiple)
      this.filled =
        (this.value && this.value.length) ||
        (this.multiInputEL &&
          this.multiInputEL.nativeElement &&
          this.multiInputEL.nativeElement.value != '');
    else
      this.filled =
        (this.value && this.value != '') ||
        (this.inputEL &&
          this.inputEL.nativeElement &&
          this.inputEL.nativeElement.value != '');
  }

  updateInputField() {
    let formattedValue = this.resolveFieldData(this.value);
    this.value = formattedValue;

    if (this.inputEL && this.inputEL.nativeElement) {
      this.inputEL.nativeElement.value = formattedValue;
    }

    this.updateFilledState();
  }

  bindDocumentClickListener() {
    if (!this.documentClickListener) {
      const documentTarget: any = this.el
        ? this.el.nativeElement.ownerDocument
        : 'document';

      this.documentClickListener = this.renderer.listen(
        documentTarget,
        'click',
        (event) => {
          if (event.which === 3) {
            return;
          }

          if (!this.inputClick && !this.isDropdownClick(event)) {
            this.hide();
          }

          this.inputClick = false;
          this.cd.markForCheck();
        }
      );
    }
  }

  isDropdownClick(event) {
    if (this.dropdown) {
      let target = event.target;
      return (
        target === this.dropdownButton.nativeElement ||
        target.parentNode === this.dropdownButton.nativeElement
      );
    } else {
      return false;
    }
  }

  unbindDocumentClickListener() {
    if (this.documentClickListener) {
      this.documentClickListener();
      this.documentClickListener = null;
    }
  }

  bindDocumentResizeListener() {
    this.documentResizeListener = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.documentResizeListener);
  }

  unbindDocumentResizeListener() {
    if (this.documentResizeListener) {
      window.removeEventListener('resize', this.documentResizeListener);
      this.documentResizeListener = null;
    }
  }

  onWindowResize() {
    this.hide();
  }

  bindScrollListener() {
    if (!this.scrollHandler) {
      this.scrollHandler = new ConnectedOverlayScrollHandler(
        this.containerEL.nativeElement,
        () => {
          if (this.overlayVisible) {
            this.hide();
          }
        }
      );
    }

    this.scrollHandler.bindScrollListener();
  }

  unbindScrollListener() {
    if (this.scrollHandler) {
      this.scrollHandler.unbindScrollListener();
    }
  }

  onOverlayHide() {
    this.unbindDocumentClickListener();
    this.unbindDocumentResizeListener();
    this.unbindScrollListener();
    this.overlay = null;
    this.onHide.emit();
  }
  constructParser() {
    this.numberFormat = new Intl.NumberFormat(this.locale, this.getOptions());
    const numerals = [
      ...new Intl.NumberFormat(this.locale, { useGrouping: false }).format(
        9876543210
      ),
    ].reverse();
    const index = new Map(numerals.map((d, i) => [d, i]));
    this._numeral = new RegExp(`[${numerals.join('')}]`, 'g');
    this._decimal = this.getDecimalExpression();
    this._group = this.getGroupingExpression();
    this._minusSign = this.getMinusSignExpression();
    this._currency = this.getCurrencyExpression();
    this._suffix = this.getSuffixExpression();
    this._prefix = this.getPrefixExpression();
    this._index = d => index.get(d);
  }
  getDecimalExpression() {
    const formatter = new Intl.NumberFormat(this.locale, {useGrouping: false});
    return new RegExp(`[${formatter.format(1.1).trim().replace(this._numeral, '')}]`, 'g');
}

getGroupingExpression() {
    const formatter = new Intl.NumberFormat(this.locale, {useGrouping: true});
    this.groupChar = formatter.format(1000000).trim().replace(this._numeral, '').charAt(0);
    return new RegExp(`[${this.groupChar}]`, 'g');
}

getMinusSignExpression() {
    const formatter = new Intl.NumberFormat(this.locale, {useGrouping: false});
    return new RegExp(`[${formatter.format(-1).trim().replace(this._numeral, '')}]`, 'g');
}

getCurrencyExpression() {
    if (this.currency) {
        const formatter = new Intl.NumberFormat(this.locale, {style: 'currency', currency: this.currency, currencyDisplay: this.currencyDisplay});
        return new RegExp(`[${formatter.format(1).replace(/\s/g, '').replace(this._numeral, '').replace(this._decimal, '').replace(this._group, '')}]`, 'g');
    }

    return new RegExp(`[]`,'g');
}

getPrefixExpression() {
    if (this.prefix) {
        this.prefixChar = this.prefix;
    }
    else {
        const formatter = new Intl.NumberFormat(this.locale, {style: this.mode, currency: this.currency, currencyDisplay: this.currencyDisplay});
        this.prefixChar = formatter.format(1).split('1')[0];
    }

    return new RegExp(`${this.escapeRegExp(this.prefixChar||'')}`, 'g');
}

getSuffixExpression() {
    if (this.suffix) {
        this.suffixChar = this.suffix;
    }
    else {
        const formatter = new Intl.NumberFormat(this.locale, {style: this.mode, currency: this.currency, currencyDisplay: this.currencyDisplay,
            minimumFractionDigits: 0, maximumFractionDigits: 0});
        this.suffixChar = formatter.format(1).split('1')[1];
    }

    return new RegExp(`${this.escapeRegExp(this.suffixChar||'')}`, 'g');
}
escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
  spin(event, dir) {
    let step = this.step * dir;
    let currentValue = this.parseValue(this.input.nativeElement.value) || 0;
    let newValue = this.validateValue(currentValue + step);
    if (this.maxlength && this.maxlength < this.formatValue(newValue).length) {
      return;
    }

    this.updateInput(newValue, null, 'spin');
    this.updateModel(event, newValue);

    this.handleOnInput(event, currentValue, newValue);
  }
  updateModel(event, value) {
    if (this.value !== value) {
      this.value = value;
      this.onModelChange(value);
    }

    this.onModelTouched();
  }
  handleOnInput(event, currentValue, newValue) {
    if (this.isValueChanged(currentValue, newValue)) {
      this.onInput.emit({ originalEvent: event, value: newValue });
    }
  }
  isValueChanged(currentValue, newValue) {
    if (newValue === null && currentValue !== null) {
      return true;
    }

    if (newValue != null) {
      let parsedCurrentValue =
        typeof currentValue === 'string'
          ? this.parseValue(currentValue)
          : currentValue;
      return newValue !== parsedCurrentValue;
    }

    return false;
  }
  isNumeralChar(char) {
    if (
      char.length === 1 &&
      (this._numeral.test(char) ||
        this._decimal.test(char) ||
        this._group.test(char) ||
        this._minusSign.test(char))
    ) {
      this.resetRegex();
      return true;
    }

    return false;
  }

  resetRegex() {
    this._numeral.lastIndex = 0;
    this._decimal.lastIndex = 0;
    this._group.lastIndex = 0;
    this._minusSign.lastIndex = 0;
  }
  initCursor() {
    let selectionStart = this.input.nativeElement.selectionStart;
    let inputValue = this.input.nativeElement.value;
    let valueLength = inputValue.length;
    let index = null;

    let char = inputValue.charAt(selectionStart);
    if (this.isNumeralChar(char)) {
      return;
    }

    //left
    let i = selectionStart - 1;
    while (i >= 0) {
      char = inputValue.charAt(i);
      if (this.isNumeralChar(char)) {
        index = i;
        break;
      } else {
        i--;
      }
    }

    if (index !== null) {
      this.input.nativeElement.setSelectionRange(index + 1, index + 1);
    } else {
      i = selectionStart + 1;
      while (i < valueLength) {
        char = inputValue.charAt(i);
        if (this.isNumeralChar(char)) {
          index = i;
          break;
        } else {
          i++;
        }
      }

      if (index !== null) {
        this.input.nativeElement.setSelectionRange(index, index);
      }
    }
  }
  updateInput(value, insertedValueStr, operation) {
    insertedValueStr = insertedValueStr || '';

    let inputValue = this.input.nativeElement.value;
    let newValue = this.formatValue(value);
    let currentLength = inputValue.length;

    if (currentLength === 0) {
      this.input.nativeElement.value = newValue;
      this.input.nativeElement.setSelectionRange(0, 0);
      this.initCursor();
      const prefixLength = (this.prefixChar || '').length;
      const selectionEnd = prefixLength + insertedValueStr.length;
      this.input.nativeElement.setSelectionRange(selectionEnd, selectionEnd);
    } else {
      let selectionStart = this.input.nativeElement.selectionStart;
      let selectionEnd = this.input.nativeElement.selectionEnd;
      if (this.maxlength && this.maxlength < newValue.length) {
        return;
      }

      this.input.nativeElement.value = newValue;
      let newLength = newValue.length;

      if (operation === 'range-insert') {
        const startValue = this.parseValue(
          (inputValue || '').slice(0, selectionStart)
        );
        const startValueStr = startValue !== null ? startValue.toString() : '';
        const startExpr = startValueStr.split('').join(`(${this.groupChar})?`);
        const sRegex = new RegExp(startExpr, 'g');
        sRegex.test(newValue);

        const tExpr = insertedValueStr.split('').join(`(${this.groupChar})?`);
        const tRegex = new RegExp(tExpr, 'g');
        tRegex.test(newValue.slice(sRegex.lastIndex));

        selectionEnd = sRegex.lastIndex + tRegex.lastIndex;
        this.input.nativeElement.setSelectionRange(selectionEnd, selectionEnd);
      } else if (newLength === currentLength) {
        if (operation === 'insert' || operation === 'delete-back-single')
          this.input.nativeElement.setSelectionRange(
            selectionEnd + 1,
            selectionEnd + 1
          );
        else if (operation === 'delete-single')
          this.input.nativeElement.setSelectionRange(
            selectionEnd - 1,
            selectionEnd - 1
          );
        else if (operation === 'delete-range' || operation === 'spin')
          this.input.nativeElement.setSelectionRange(
            selectionEnd,
            selectionEnd
          );
      } else if (operation === 'delete-back-single') {
        let prevChar = inputValue.charAt(selectionEnd - 1);
        let nextChar = inputValue.charAt(selectionEnd);
        let diff = currentLength - newLength;
        let isGroupChar = this._group.test(nextChar);

        if (isGroupChar && diff === 1) {
          selectionEnd += 1;
        } else if (!isGroupChar && this.isNumeralChar(prevChar)) {
          selectionEnd += -1 * diff + 1;
        }

        this._group.lastIndex = 0;
        this.input.nativeElement.setSelectionRange(selectionEnd, selectionEnd);
      } else {
        selectionEnd = selectionEnd + (newLength - currentLength);
        this.input.nativeElement.setSelectionRange(selectionEnd, selectionEnd);
      }
    }

    this.input.nativeElement.setAttribute('aria-valuenow', value);
  }

  validateValue(value) {
    if (this.min !== null && value < this.min) {
      return this.min;
    }

    if (this.max !== null && value > this.max) {
      return this.max;
    }

    if (value === '-') {
      // Minus sign
      return null;
    }

    return value;
  }
  ngOnDestroy() {
    if (this.forceSelectionUpdateModelTimeout) {
      clearTimeout(this.forceSelectionUpdateModelTimeout);
      this.forceSelectionUpdateModelTimeout = null;
    }

    if (this.scrollHandler) {
      this.scrollHandler.destroy();
      this.scrollHandler = null;
    }
    this.restoreOverlayAppend();
    this.onOverlayHide();
  }
  formattedValue() {
    return this.formatValue(this.value);
  }
  parseValue(text) {
    let filteredText = text
      .replace(this._suffix, '')
      .replace(this._prefix, '')
      .trim()
      .replace(/\s/g, '')
      .replace(this._currency, '')
      .replace(this._group, '')
      .replace(this._minusSign, '-')
      .replace(this._decimal, '.')
      .replace(this._numeral, this._index);

    if (filteredText) {
      if (filteredText === '-')
        // Minus sign
        return filteredText;

      let parsedValue = +filteredText;
      return isNaN(parsedValue) ? null : parsedValue;
    }

    return null;
  }

  formatValue(valueFormat) {
    let value = valueFormat && this.removeCommaSeperator(valueFormat);
    if (value && value != null) {
      if (value === '-') {
        // Minus sign
        this.value = value;
        return value;
      }

      if (this.format) {
        let formatter = new Intl.NumberFormat(this.locale, this.getOptions());
        let formattedValue = formatter.format(value);
        if (this.prefix) {
          formattedValue = this.prefix + formattedValue;
        }

        if (this.suffix) {
          formattedValue = formattedValue + this.suffix;
        }
        this.value = formattedValue;
        return formattedValue;
      }
      this.value = value.toString();
      return value.toString();
    }
    this.value = '';
    return '';
  }
}

@NgModule({
  imports: [
    CommonModule,
    InputTextModule,
    ButtonModule,
    SharedModule,
    RippleModule,
  ],
  exports: [AutoComplete, SharedModule],
  declarations: [AutoComplete],
})
export class AutoFormatAmount {}
