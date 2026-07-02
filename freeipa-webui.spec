%global debug_package %{nil}

Name:           freeipa-webui
Version:        0.2.0
Release:        1.poc%{?dist}
Summary:        FreeIPA Modern Web UI (PoC build with topology analysis)
License:        GPL-3.0-or-later
URL:            https://github.com/Amy-Ra-lph/freeipa-webui
Source0:        %{name}-%{version}.tar.gz

BuildRequires:  nodejs >= 18
BuildRequires:  npm

BuildArch:      noarch
Requires:       ipa-server-common

%description
Modern React/PatternFly 6 Web UI for FreeIPA. Includes 14 additional
entity pages for feature parity with the legacy Dojo UI, plus topology
analysis engine with health scoring, failure simulation, and pattern
classification.

This is a PoC overlay package that replaces the modern-ui assets
shipped in ipa-server-common.

%prep
%autosetup

%build
npm ci --ignore-scripts
npm run build

%install
mkdir -p %{buildroot}%{_datadir}/ipa/modern-ui
cp -a dist/* %{buildroot}%{_datadir}/ipa/modern-ui/

%files
%license COPYING
%{_datadir}/ipa/modern-ui/
