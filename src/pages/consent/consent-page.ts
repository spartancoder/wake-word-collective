import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import "@material/web/checkbox/checkbox";
import "@material/web/button/text-button";
import "@material/web/textfield/filled-text-field";
import "@material/web/select/filled-select";
import "@material/web/select/select-option";
import "../../components/card-layout";
import { WAKE_WORDS, ICON_CHEVRON_SLOTTED, PAGE_STYLES } from "../../const";
import { preloadImage } from "../../util/preload";
import { LEGACY_ACCENTS, AGES, GENDERS } from "../../util/demographics";

@customElement("consent-page")
export class ConsentPage extends LitElement {
  @property() public giveConsent!: (description: string) => void;
  @property() public cancelConsent!: () => void;

  @property() public wakeWord!: string;
  @property() public description!: string;

  @state() private selectedLanguageCode: string = "";
  @state() private selectedAccent: string = "";
  @state() private selectedAge: string = "";
  @state() private selectedGender: string = "";

  @query("md-filled-select.language-code") private languageCodeSelect!: any;
  @query("md-filled-select.accent") private accentSelect!: any;
  @query("md-filled-select.age") private ageSelect!: any;
  @query("md-filled-select.gender") private genderSelect!: any;

  @query("md-checkbox") private consentCheckbox!: HTMLInputElement;

  firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);

    preloadImage("./images/demo.gif");
  }

  getLanguageDisplayName(code: string): string {
    const languageNames: Record<string, string> = {
      br: 'Breton',
      ca: 'Catalan',
      cy: 'Welsh',
      de: 'German',
      en: 'English',
      eo: 'Esperanto',
      es: 'Spanish',
      eu: 'Basque',
      fr: 'French',
      'nan-tw': 'Taiwanese Hokkien',
      nl: 'Dutch',
      'ga-IE': 'Irish',
      gl: 'Galician',
      'zh-TW': 'Traditional Chinese (Taiwan)',
      'zh-CN': 'Simplified Chinese (China)',
    };
    return languageNames[code] || code;
  }

  renderAccentOptions() {
    if (!this.selectedLanguageCode) {
      return html``;
    }

    const accents = LEGACY_ACCENTS[this.selectedLanguageCode];
    if (!accents) {
      return html``;
    }

    return Object.entries(accents as Record<string, string>).map(
      ([accentKey, accentLabel]) => html`
        <md-select-option value=${accentKey}>
          <div slot="headline">${accentLabel}</div>
        </md-select-option>
      `,
    );
  }

  handleLanguageCodeChange(e: any) {
    this.selectedLanguageCode = e.target.value;
    this.selectedAccent = ""; // Reset accent when language changes

    // Reset the accent select element
    if (this.accentSelect) {
      this.accentSelect.value = "";
    }
  }

  render() {
    return html`
      <card-layout header="Some details">
        <div class="card-content" slot="content">
          <p>
            Selected wake word:
            <strong>${WAKE_WORDS[this.wakeWord]}</strong>
            ${Object.keys(WAKE_WORDS).length > 1
              ? html`
                  &nbsp;(<a href="#" @click=${this.cancelConsent}>change</a>)
                `
              : ""}
          </p>
          <p class="consent">
            <strong>Consent</strong><br />
            We want to make all recordings publicly available without
            restrictions, for which we need your consent.
          </p>
          <label class="formfield">
            <md-checkbox touch-target="wrapper"></md-checkbox>
            <span>
              I agree to the
              <a href="./terms.html" target="_blank">
                Wake Word Collective terms
              </a>
            </span>
          </label>
          <p>
            <strong>Demographics</strong><br />
            Please provide some information to help us improve the wake word
            engine for diverse voices.
          </p>
          <md-filled-select
            class="language-code"
            label="Language"
            @change=${this.handleLanguageCodeChange}
          >
            <md-select-option value="">
              <div slot="headline">Select your language</div>
            </md-select-option>
            ${Object.keys(LEGACY_ACCENTS).map(
              (code) => html`
                <md-select-option value=${code}>
                  <div slot="headline">${this.getLanguageDisplayName(code)}</div>
                </md-select-option>
              `,
            )}
          </md-filled-select>
          <md-filled-select
            class="accent"
            label="Accent/Variant"
            .value=${this.selectedAccent}
            ?disabled=${!this.selectedLanguageCode}
            @change=${(e: any) => (this.selectedAccent = e.target.value)}
          >
            <md-select-option value="">
              <div slot="headline">
                ${this.selectedLanguageCode
                  ? "Select your accent/variant"
                  : "Select language first"}
              </div>
            </md-select-option>
            ${this.renderAccentOptions()}
          </md-filled-select>
          <md-filled-select
            class="age"
            label="Age Range"
            @change=${(e: any) => (this.selectedAge = e.target.value)}
          >
            <md-select-option value="">
              <div slot="headline">Select your age range</div>
            </md-select-option>
            ${Object.entries(AGES).map(
              ([key, label]) =>
                label &&
                html`
                  <md-select-option value=${key}>
                    <div slot="headline">${label}</div>
                  </md-select-option>
                `,
            )}
          </md-filled-select>
          <md-filled-select
            class="gender"
            label="Gender"
            @change=${(e: any) => (this.selectedGender = e.target.value)}
          >
            <md-select-option value="">
              <div slot="headline">Select your gender</div>
            </md-select-option>
            ${Object.entries(GENDERS).map(
              ([key, label]) => html`
                <md-select-option value=${key}>
                  <div slot="headline">${label}</div>
                </md-select-option>
              `,
            )}
          </md-filled-select>
        </div>
        <div class="card-actions" slot="actions">
          <span></span>
          <md-text-button has-icon trailing-icon @click=${this.submitConsent}>
            Submit ${ICON_CHEVRON_SLOTTED}
          </md-text-button>
        </div>
      </card-layout>
    `;
  }

  async submitConsent() {
    if (!this.consentCheckbox.checked) {
      this.consentCheckbox.focus();
      alert("Please agree to the Wake Word Collective terms");
      return;
    }

    if (!this.selectedLanguageCode) {
      this.languageCodeSelect.focus();
      alert("Please select your language");
      return;
    }

    if (!this.selectedAccent) {
      this.accentSelect.focus();
      alert("Please select your accent/variant");
      return;
    }

    if (!this.selectedAge) {
      this.ageSelect.focus();
      alert("Please select your age range");
      return;
    }

    if (!this.selectedGender) {
      this.genderSelect.focus();
      alert("Please select your gender");
      return;
    }

    // Combine demographics into a structured description
    const description = JSON.stringify({
      language: this.selectedLanguageCode,
      accent: this.selectedAccent,
      age: this.selectedAge,
      gender: this.selectedGender,
    });

    this.giveConsent(description);
  }

  static styles = [
    PAGE_STYLES,
    css`
      p.consent {
        margin-bottom: 0;
      }

      md-checkbox {
        min-width: 18px;
      }

      md-filled-text-field,
      md-filled-select {
        display: block;
        margin-top: 16px;
        width: 100%;
      }

      label.formfield {
        display: flex;
        align-items: center;
        padding-right: 8px;
      }

      .helper {
        font-size: 12px;
        display: block;
        padding-left: 16px;
      }
    `,
  ];
}
