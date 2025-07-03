// Market Sentiment Dashboard - JavaScript with TradingView Integration
class MarketSentimentDashboard {
    constructor() {
        this.autoRefreshEnabled = false;
        this.refreshInterval = null;
        this.currentSymbol = 'NASDAQ:IXIC';
        this.currentSymbolData = {
            name: 'NASDAQ Composite',
            currency: 'USD',
            type: 'index',
            exchange: 'NASDAQ'
        };
        this.tradingViewWidget = null;
        this.dataCache = new Map(); // Cache for fast symbol switching
        this.cacheTimeout = 30000; // 30 seconds cache
        this.realTimeData = {
            price: 0,
            change: 0,
            changePercent: 0,
            volume: 0,
            marketCap: 0
        };
        this.init();
    }

    init() {
        // Start immediately with placeholder data
        this.updateLastUpdated();
        this.updateDataSourceIndicator('connecting');
        
        // Load market data immediately (non-blocking)
        this.loadMarketData();
        
        // Set up TradingView widget in parallel
        this.setupTradingViewWidget();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Auto-refresh will be set up when user clicks the button
    }

    setupTradingViewWidget() {
        // Initialize TradingView widget for real-time data
        if (typeof TradingView !== 'undefined') {
            this.createTradingViewWidget();
            // Set up data extraction from TradingView widget
            this.setupTradingViewDataExtraction();
        } else {
            // Fallback if TradingView is not loaded
            console.warn('TradingView library not loaded, using simulated data');
            setTimeout(() => this.setupTradingViewWidget(), 1000);
        }
    }

    createTradingViewWidget() {
        try {
            this.tradingViewWidget = new TradingView.widget({
                "width": 300,
                "height": 200,
                "symbol": this.currentSymbol,
                "interval": "1",
                "timezone": "Etc/UTC",
                "theme": "light",
                "style": "1",
                "locale": "en",
                "toolbar_bg": "#f1f3f6",
                "enable_publishing": false,
                "hide_side_toolbar": true,
                "allow_symbol_change": false,
                "container_id": "tradingview_widget",
                "hide_top_toolbar": true,
                "hide_legend": true,
                "save_image": false,
                "calendar": false,
                "popup_width": "1000",
                "popup_height": "650",
                "no_referral_id": true,
                "withdateranges": false,
                "details": false,
                "hotlist": false,
                "calendar": false,
                "studies": [],
                "show_popup_button": false,
                "overrides": {},
                "enabled_features": [],
                "disabled_features": ["use_localstorage_for_settings"]
            });

            // Set up real-time data fetching
            this.fetchRealTimeData();
        } catch (error) {
            console.error('Error creating TradingView widget:', error);
            this.useFallbackData();
        }
    }

    async fetchRealTimeData() {
        try {
            // Using TradingView's public API endpoints
            const response = await fetch(`https://scanner.tradingview.com/symbol?symbol=${encodeURIComponent(this.currentSymbol)}&fields=close_price,change,change_percent,volume,market_cap_basic,currency_code,description,type,exchange`);
            
            if (response.ok) {
                const data = await response.json();
                this.processRealTimeData(data);
            } else {
                throw new Error('Failed to fetch real-time data');
            }
        } catch (error) {
            console.warn('Could not fetch real-time data, using enhanced simulation:', error);
            this.useEnhancedSimulation();
        }
    }

    processRealTimeData(data) {
        if (data && data.data) {
            const symbolData = data.data[0];
            this.realTimeData = {
                price: symbolData.close_price || 0,
                change: symbolData.change || 0,
                changePercent: symbolData.change_percent || 0,
                volume: symbolData.volume || 0,
                marketCap: symbolData.market_cap_basic || 0,
                currency: symbolData.currency_code || this.currentSymbolData.currency,
                description: symbolData.description || this.currentSymbolData.name
            };
        } else {
            this.useEnhancedSimulation();
        }
    }

    useEnhancedSimulation() {
        // Update data source indicator
        this.updateDataSourceIndicator('simulated');
        
        // Enhanced simulation based on real market patterns
        const marketHours = this.getMarketHours();
        const volatilityMultiplier = marketHours.isOpen ? 1.0 : 0.3;
        
        const symbolInfo = this.getSymbolInfo(this.currentSymbol);
        const basePrice = symbolInfo.basePrice;
        const volatility = symbolInfo.volatility * volatilityMultiplier;
        
        // Generate realistic price movement
        const randomChange = (Math.random() - 0.5) * 2 * basePrice * volatility;
        const currentPrice = basePrice + randomChange;
        const changePercent = (randomChange / basePrice * 100);
        
        this.realTimeData = {
            price: currentPrice,
            change: randomChange,
            changePercent: changePercent,
            volume: this.generateVolume(symbolInfo),
            marketCap: this.generateMarketCap(symbolInfo, currentPrice),
            currency: this.currentSymbolData.currency,
            description: this.currentSymbolData.name
        };
    }

    getMarketHours() {
        const now = new Date();
        const hours = now.getUTCHours();
        const dayOfWeek = now.getUTCDay();
        
        // Simplified market hours (US market hours in UTC)
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        const isMarketHours = hours >= 14 && hours < 21; // 9:30 AM - 4:00 PM EST
        
        return {
            isOpen: isWeekday && isMarketHours,
            hours: hours
        };
    }

    updateLastUpdated() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('lastUpdated').textContent = timeString;
    }

    // Generate market data using real-time data or enhanced simulation
    generateMarketData() {
        return {
            index: this.realTimeData.price,
            change: this.realTimeData.change,
            changePercent: this.realTimeData.changePercent,
            volume: this.formatVolume(this.realTimeData.volume),
            marketCap: this.formatMarketCap(this.realTimeData.marketCap),
            currency: this.realTimeData.currency || this.currentSymbolData.currency,
            name: this.realTimeData.description || this.currentSymbolData.name,
            type: this.getSymbolInfo(this.currentSymbol).type
        };
    }

    generateTechnicalIndicators() {
        const symbolInfo = this.getSymbolInfo(this.currentSymbol);
        
        // Adjust indicators based on asset type and real market conditions
        let rsiBase = 50;
        let macdBullishChance = 0.5;
        let maBullishChance = 0.6;
        
        // Market hours influence
        const marketHours = this.getMarketHours();
        if (!marketHours.isOpen) {
            // Lower volatility during off-hours
            rsiBase = 45 + Math.random() * 10;
        }
        
        // Crypto tends to be more volatile
        if (symbolInfo.type === 'crypto') {
            rsiBase = Math.random() > 0.5 ? 30 + Math.random() * 40 : 60 + Math.random() * 30;
            macdBullishChance = 0.4;
        }
        
        // Commodities can be more cyclical
        if (symbolInfo.type === 'commodity') {
            maBullishChance = 0.55;
        }
        
        // Use real price movement to influence indicators
        const changePercent = this.realTimeData.changePercent;
        if (changePercent > 1) {
            rsiBase += 10;
            macdBullishChance += 0.2;
            maBullishChance += 0.2;
        } else if (changePercent < -1) {
            rsiBase -= 10;
            macdBullishChance -= 0.2;
            maBullishChance -= 0.2;
        }
        
        return {
            rsi: Math.max(0, Math.min(100, rsiBase + (Math.random() - 0.5) * 20)),
            macd: Math.random() > macdBullishChance ? 'bullish' : 'bearish',
            movingAverage: Math.random() > maBullishChance ? 'bullish' : Math.random() > 0.3 ? 'neutral' : 'bearish',
            bollingerBands: Math.random() > 0.5 ? 'bullish' : 'bearish'
        };
    }

    generateFearGreedIndex() {
        return Math.floor(Math.random() * 100);
    }

    analyzeSentiment(marketData, indicators, fearGreed) {
        let score = 0;
        let reasons = [];

        // Analyze price movement
        if (marketData.changePercent > 1) {
            score += 30;
            reasons.push("Strong positive price movement");
        } else if (marketData.changePercent > 0) {
            score += 15;
            reasons.push("Positive price movement");
        } else if (marketData.changePercent < -1) {
            score -= 30;
            reasons.push("Significant price decline");
        } else {
            score -= 15;
            reasons.push("Negative price movement");
        }

        // Analyze RSI
        if (indicators.rsi < 30) {
            score += 20;
            reasons.push("RSI indicates oversold condition (potential buying opportunity)");
        } else if (indicators.rsi > 70) {
            score -= 20;
            reasons.push("RSI indicates overbought condition");
        } else {
            score += 5;
            reasons.push("RSI in neutral range");
        }

        // Analyze MACD
        if (indicators.macd === 'bullish') {
            score += 15;
            reasons.push("MACD showing bullish momentum");
        } else {
            score -= 15;
            reasons.push("MACD showing bearish momentum");
        }

        // Analyze Moving Average
        if (indicators.movingAverage === 'bullish') {
            score += 10;
            reasons.push("Price above moving average");
        } else if (indicators.movingAverage === 'bearish') {
            score -= 10;
            reasons.push("Price below moving average");
        }

        // Analyze Fear & Greed
        if (fearGreed < 25) {
            score += 15;
            reasons.push("Extreme fear presents buying opportunities");
        } else if (fearGreed > 75) {
            score -= 15;
            reasons.push("Extreme greed suggests caution");
        }

        // Determine recommendation
        let recommendation, sentiment;
        if (score >= 25) {
            recommendation = "STRONG BUY";
            sentiment = "buy";
        } else if (score >= 10) {
            recommendation = "BUY";
            sentiment = "buy";
        } else if (score >= -10) {
            recommendation = "HOLD";
            sentiment = "hold";
        } else if (score >= -25) {
            recommendation = "SELL";
            sentiment = "sell";
        } else {
            recommendation = "STRONG SELL";
            sentiment = "sell";
        }

        return {
            recommendation,
            sentiment,
            score,
            reasons: reasons.slice(0, 3) // Top 3 reasons
        };
    }

    formatNumber(num) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    formatVolume(volume) {
        if (volume >= 1000000000) {
            return (volume / 1000000000).toFixed(1) + 'B';
        } else if (volume >= 1000000) {
            return (volume / 1000000).toFixed(1) + 'M';
        }
        return volume.toLocaleString();
    }

    formatMarketCap(cap) {
        if (cap >= 1000000000000) {
            return '$' + (cap / 1000000000000).toFixed(1) + 'T';
        } else if (cap >= 1000000000) {
            return '$' + (cap / 1000000000).toFixed(1) + 'B';
        }
        return '$' + cap.toLocaleString();
    }

    updateMarketOverview(data) {
        // Extract symbol name from TradingView format
        const symbolParts = this.currentSymbol.split(':');
        const shortSymbol = symbolParts.length > 1 ? symbolParts[1] : this.currentSymbol;
        
        // Update symbol label and title
        document.getElementById('symbolLabel').textContent = shortSymbol;
        document.getElementById('marketTitle').textContent = data.name;
        
        // Format price based on asset type and currency
        let formattedPrice;
        if (data.type === 'crypto' && data.index < 1) {
            formattedPrice = data.index.toFixed(6); // More decimals for small crypto values
        } else if (data.type === 'commodity' && data.index < 10) {
            formattedPrice = data.index.toFixed(3);
        } else if (data.index > 10000) {
            formattedPrice = this.formatNumber(data.index); // For large indices
        } else {
            formattedPrice = data.index.toFixed(2);
        }
        
        // Add currency symbol
        const currencySymbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 
            'CNY': '¥', 'KRW': '₩', 'HKD': 'HK$', 'AUD': 'A$'
        };
        const currencySymbol = currencySymbols[data.currency] || data.currency;
        
        document.getElementById('nasdaqIndex').textContent = `${currencySymbol}${formattedPrice}`;
        document.getElementById('currency').textContent = data.currency;
        
        const changeElement = document.getElementById('nasdaqChange');
        const changeText = `${data.change >= 0 ? '+' : ''}${currencySymbol}${this.formatNumber(Math.abs(data.change))} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`;
        changeElement.textContent = changeText;
        changeElement.className = `change ${data.change >= 0 ? 'positive' : 'negative'}`;
        
        document.getElementById('volume').textContent = data.volume;
        document.getElementById('marketCap').textContent = data.marketCap;
    }

    updateSentimentAnalysis(analysis) {
        const sentimentCircle = document.getElementById('sentimentCircle');
        const sentimentText = document.getElementById('sentimentText');
        
        sentimentCircle.className = `sentiment-circle ${analysis.sentiment}`;
        sentimentText.textContent = analysis.sentiment.toUpperCase();
        
        document.getElementById('recommendationText').textContent = analysis.recommendation;
        document.getElementById('recommendationReason').textContent = analysis.reasons.join('. ') + '.';
    }

    updateTechnicalIndicators(indicators) {
        // Update RSI
        const rsiValue = Math.round(indicators.rsi);
        document.getElementById('rsiValue').textContent = rsiValue;
        document.getElementById('rsiBar').style.width = `${indicators.rsi}%`;
        
        // Update other indicators
        this.updateIndicatorStatus('macdStatus', indicators.macd);
        this.updateIndicatorStatus('maStatus', indicators.movingAverage);
        this.updateIndicatorStatus('bbStatus', indicators.bollingerBands);
    }

    updateIndicatorStatus(elementId, status) {
        const element = document.getElementById(elementId);
        element.textContent = status.toUpperCase();
        element.className = `indicator-status ${status}`;
    }

    updateFearGreedIndex(value) {
        document.getElementById('fearGreedValue').textContent = value;
        
        let label, needleRotation;
        if (value <= 25) {
            label = "Extreme Fear";
            needleRotation = -90 + (value / 25) * 45; // -90 to -45 degrees
        } else if (value <= 50) {
            label = "Fear";
            needleRotation = -45 + ((value - 25) / 25) * 45; // -45 to 0 degrees
        } else if (value <= 75) {
            label = "Greed";
            needleRotation = 0 + ((value - 50) / 25) * 45; // 0 to 45 degrees
        } else {
            label = "Extreme Greed";
            needleRotation = 45 + ((value - 75) / 25) * 45; // 45 to 90 degrees
        }
        
        document.getElementById('fearGreedLabel').textContent = label;
        document.getElementById('gaugeNeedle').style.transform = `translateX(-50%) rotate(${needleRotation}deg)`;
    }

    loadMarketData() {
        // Check cache first for instant display
        const cachedData = this.getCachedData(this.currentSymbol);
        if (cachedData) {
            this.realTimeData = cachedData;
            this.updateMarketDataFromReal();
            return; // Use cached data, no loading needed
        }
        
        // Add loading animation
        this.addLoadingAnimation();
        this.updateDataSourceIndicator('connecting');
        
        // Start with immediate simulated data for fast display
        this.useEnhancedSimulation();
        this.updateMarketDataFromSimulation();
        
        // Then try to fetch real-time data in parallel (non-blocking)
        this.fetchAllDataSources().catch(() => {
            // Already showing simulated data, so this is just for updating to real data
            console.log('Using simulated data - real-time API unavailable');
        }).finally(() => {
            this.removeLoadingAnimation();
        });
    }

    addLoadingAnimation() {
        const elements = ['nasdaqIndex', 'nasdaqChange', 'volume', 'marketCap', 'sentimentText', 'recommendationText'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('loading');
        });
    }

    removeLoadingAnimation() {
        const elements = ['nasdaqIndex', 'nasdaqChange', 'volume', 'marketCap', 'sentimentText', 'recommendationText'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.remove('loading');
        });
    }

    // Handle symbol change with TradingView integration
    changeSymbol(newSymbol) {
        if (!newSymbol) {
            const selectElement = document.getElementById('symbolSelect');
            newSymbol = selectElement.value;
            
            // Update current symbol data from select element
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            this.currentSymbolData = {
                name: selectedOption.getAttribute('data-name'),
                currency: selectedOption.getAttribute('data-currency'),
                type: this.getSymbolInfo(newSymbol).type,
                exchange: selectedOption.getAttribute('data-exchange')
            };
        }
        
        this.currentSymbol = newSymbol;
        
        // Update TradingView widget with new symbol
        if (this.tradingViewWidget) {
            try {
                // Re-create widget with new symbol
                document.getElementById('tradingview_widget').innerHTML = '';
                this.createTradingViewWidget();
            } catch (error) {
                console.warn('Error updating TradingView widget:', error);
            }
        }
        
        // Add visual feedback for symbol change
        const header = document.querySelector('.header h1');
        header.style.transform = 'scale(0.95)';
        header.style.opacity = '0.7';
        
        setTimeout(() => {
            header.style.transform = 'scale(1)';
            header.style.opacity = '1';
        }, 200);
        
        // Set up data extraction for new symbol - start immediately
        this.setupTradingViewDataExtraction();
        
        // Refresh data for new symbol immediately with fast display
        this.loadMarketData();
    }

    updateSymbol(symbol, name, currency) {
        this.currentSymbol = symbol;
        this.currentSymbolData.name = name;
        this.currentSymbolData.currency = currency;
        
        // Update UI elements
        document.getElementById('symbolLabel').textContent = name.split(' ')[0];
        
        // Fetch real-time data for new symbol
        this.fetchTradingViewAPI().catch(() => {
            // Fallback to enhanced simulation if API fails
            this.loadMarketData();
        });
    }

    getSymbolInfo(symbol) {
        // Enhanced symbol information with real market characteristics
        const symbolsData = {
            // US Markets
            'NASDAQ:IXIC': { basePrice: 15000, volatility: 0.02, type: 'index' },
            'SP:SPX': { basePrice: 4500, volatility: 0.015, type: 'index' },
            'DJ:DJI': { basePrice: 35000, volatility: 0.015, type: 'index' },
            'TVC:RUT': { basePrice: 2000, volatility: 0.025, type: 'index' },
            
            // European Markets
            'TVC:UKX': { basePrice: 7500, volatility: 0.018, type: 'index' },
            'TVC:DAX': { basePrice: 16000, volatility: 0.02, type: 'index' },
            'TVC:CAC': { basePrice: 7200, volatility: 0.018, type: 'index' },
            'TVC:AEX': { basePrice: 800, volatility: 0.02, type: 'index' },
            
            // Asian Markets
            'TVC:NI225': { basePrice: 30000, volatility: 0.02, type: 'index' },
            'TVC:HSI': { basePrice: 20000, volatility: 0.025, type: 'index' },
            'TVC:SHCOMP': { basePrice: 3200, volatility: 0.022, type: 'index' },
            'TVC:KOSPI': { basePrice: 2600, volatility: 0.02, type: 'index' },
            'TVC:XJO': { basePrice: 7000, volatility: 0.018, type: 'index' },
            
            // Individual Stocks
            'NASDAQ:AAPL': { basePrice: 180, volatility: 0.03, type: 'stock' },
            'NASDAQ:MSFT': { basePrice: 350, volatility: 0.025, type: 'stock' },
            'NASDAQ:GOOGL': { basePrice: 130, volatility: 0.028, type: 'stock' },
            'NASDAQ:AMZN': { basePrice: 140, volatility: 0.03, type: 'stock' },
            'NASDAQ:TSLA': { basePrice: 250, volatility: 0.05, type: 'stock' },
            'NASDAQ:NVDA': { basePrice: 450, volatility: 0.04, type: 'stock' },
            
            // Commodities
            'TVC:GOLD': { basePrice: 2000, volatility: 0.015, type: 'commodity' },
            'TVC:SILVER': { basePrice: 24, volatility: 0.025, type: 'commodity' },
            'NYMEX:CL1!': { basePrice: 75, volatility: 0.03, type: 'commodity' },
            'NYMEX:NG1!': { basePrice: 3.5, volatility: 0.04, type: 'commodity' },
            
            // Cryptocurrencies
            'BINANCE:BTCUSDT': { basePrice: 65000, volatility: 0.06, type: 'crypto' },
            'BINANCE:ETHUSDT': { basePrice: 3500, volatility: 0.07, type: 'crypto' },
            'BINANCE:BNBUSDT': { basePrice: 320, volatility: 0.05, type: 'crypto' },
            'BINANCE:ADAUSDT': { basePrice: 0.8, volatility: 0.08, type: 'crypto' }
        };

        return symbolsData[symbol] || { basePrice: 100, volatility: 0.02, type: 'index' };
    }

    generateVolume(symbolInfo) {
        let baseVolume;
        switch (symbolInfo.type) {
            case 'stock':
                baseVolume = Math.random() * 100000000 + 50000000;
                break;
            case 'index':
                baseVolume = Math.random() * 5000000000 + 2000000000;
                break;
            case 'crypto':
                baseVolume = Math.random() * 2000000000 + 1000000000;
                break;
            case 'commodity':
                baseVolume = Math.random() * 500000000 + 200000000;
                break;
            default:
                baseVolume = Math.random() * 1000000000 + 500000000;
        }
        return baseVolume;
    }

    generateMarketCap(symbolInfo, currentPrice) {
        if (symbolInfo.type === 'stock') {
            const estimatedShares = Math.random() * 10000000000 + 5000000000;
            return currentPrice * estimatedShares;
        } else if (symbolInfo.type === 'crypto') {
            const estimatedSupply = Math.random() * 1000000000 + 500000000;
            return currentPrice * estimatedSupply;
        } else {
            return Math.random() * 5000000000000 + 15000000000000;
        }
    }

    setupTradingViewDataExtraction() {
        // Monitor the TradingView widget for data updates - reduced delay
        const checkForTradingViewData = () => {
            try {
                // Look for TradingView widget price data in the DOM
                const widgetIframe = document.querySelector('#tradingview-widget-symbol iframe');
                if (widgetIframe) {
                    // Set up faster data extraction
                    this.extractTradingViewData();
                    setInterval(() => this.extractTradingViewData(), 2000); // Update every 2 seconds (faster)
                } else {
                    setTimeout(checkForTradingViewData, 500); // Check more frequently
                }
            } catch (error) {
                console.warn('Could not set up TradingView data extraction:', error);
                this.useEnhancedSimulation();
            }
        };
        
        setTimeout(checkForTradingViewData, 1000); // Start checking sooner
    }

    extractTradingViewData() {
        try {
            // Try to extract data from TradingView widget
            // Note: Due to iframe restrictions, we'll use the TradingView API directly
            this.fetchTradingViewAPI();
        } catch (error) {
            console.warn('Could not extract TradingView data:', error);
            this.useEnhancedSimulation();
        }
    }

    async fetchTradingViewAPI() {
        try {
            // Use TradingView's public quote API with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            const symbol = this.currentSymbol.replace(':', '%3A');
            const response = await fetch(`https://symbol-search.tradingview.com/symbol_search/?text=${symbol}&hl=1&exchange=&lang=en&search_type=&domain=production`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.symbols && data.symbols.length > 0) {
                    const symbolData = data.symbols[0];
                    this.processSymbolData(symbolData);
                    return;
                }
            }
            
            // Immediately try Yahoo Finance if TradingView fails
            await this.fetchYahooFinanceAPI();
        } catch (error) {
            console.warn('TradingView API failed quickly, trying Yahoo Finance:', error);
            await this.fetchYahooFinanceAPI();
        }
    }

    async fetchYahooFinanceAPI() {
        try {
            // Convert TradingView symbol to Yahoo Finance format with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
            
            const yahooSymbol = this.convertToYahooSymbol(this.currentSymbol);
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
                    this.processYahooFinanceData(data.chart.result[0]);
                    return;
                }
            }
            
            throw new Error('Yahoo Finance API failed');
        } catch (error) {
            console.warn('Yahoo Finance API failed, using simulation:', error);
            this.useEnhancedSimulation();
            this.updateMarketDataFromSimulation();
        }
    }

    async fetchYahooFinanceViaProxy() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const yahooSymbol = this.convertToYahooSymbol(this.currentSymbol);
            const response = await fetch(`/api/yahoo/${yahooSymbol}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
                    this.processYahooFinanceData(data.chart.result[0]);
                    return;
                }
            }
            
            throw new Error('Proxy API failed');
        } catch (error) {
            console.warn('Proxy Yahoo Finance API failed:', error);
            this.fetchAlternativeAPI();
        }
    }

    async fetchAlphaVantageViaProxy() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const symbol = this.currentSymbol.split(':')[1] || this.currentSymbol;
            const response = await fetch(`/api/alphavantage/${symbol}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data['Global Quote']) {
                    this.processAlphaVantageData(data['Global Quote']);
                    return;
                }
            }
            
            throw new Error('Alpha Vantage API failed');
        } catch (error) {
            console.warn('Alpha Vantage API failed:', error);
            this.fetchFinnhubViaProxy();
        }
    }

    async fetchFinnhubViaProxy() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const symbol = this.convertToFinnhubSymbol(this.currentSymbol);
            const response = await fetch(`/api/finnhub/${symbol}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.c) {
                    this.processFinnhubData(data);
                    return;
                }
            }
            
            throw new Error('Finnhub API failed');
        } catch (error) {
            console.warn('Finnhub API failed:', error);
            this.useEnhancedSimulation();
            this.updateMarketDataFromSimulation();
        }
    }

    processAlphaVantageData(quote) {
        const currentPrice = parseFloat(quote['05. price']);
        const change = parseFloat(quote['09. change']);
        const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
        
        this.realTimeData = {
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            volume: 0, // Alpha Vantage doesn't provide volume in global quote
            marketCap: this.generateMarketCap(this.getSymbolInfo(this.currentSymbol), currentPrice),
            currency: this.currentSymbolData.currency,
            description: this.currentSymbolData.name
        };
        
        this.setCachedData(this.currentSymbol, this.realTimeData);
        this.updateMarketDataFromReal();
    }

    processFinnhubData(data) {
        const currentPrice = data.c;
        const change = data.d;
        const changePercent = data.dp;
        
        this.realTimeData = {
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            volume: 0, // Finnhub quote doesn't include volume
            marketCap: this.generateMarketCap(this.getSymbolInfo(this.currentSymbol), currentPrice),
            currency: this.currentSymbolData.currency,
            description: this.currentSymbolData.name
        };
        
        this.setCachedData(this.currentSymbol, this.realTimeData);
        this.updateMarketDataFromReal();
    }

    convertToFinnhubSymbol(tradingViewSymbol) {
        const symbolMap = {
            'NASDAQ:IXIC': '^IXIC',
            'SP:SPX': '^GSPC',
            'DJ:DJI': '^DJI',
            'NASDAQ:AAPL': 'AAPL',
            'NASDAQ:MSFT': 'MSFT',
            'NASDAQ:GOOGL': 'GOOGL',
            'NASDAQ:AMZN': 'AMZN',
            'NASDAQ:TSLA': 'TSLA',
            'NASDAQ:NVDA': 'NVDA'
        };
        
        return symbolMap[tradingViewSymbol] || tradingViewSymbol.split(':')[1] || tradingViewSymbol;
    }

    async fetchAllDataSources() {
        // Try multiple data sources in sequence for fastest response
        // First try proxy APIs for real data, then fallback to direct APIs
        try {
            await this.fetchYahooFinanceViaProxy();
        } catch (error) {
            try {
                await this.fetchAlphaVantageViaProxy();
            } catch (error) {
                try {
                    await this.fetchFinnhubViaProxy();
                } catch (error) {
                    // All proxy APIs failed, try direct APIs
                    await this.fetchYahooFinanceAPI();
                }
            }
        }
    }

    // ...existing code...
}

// Global functions for HTML integration
function updateMarketData(symbol, name, currency) {
    if (window.dashboard) {
        window.dashboard.updateSymbol(symbol, name, currency);
    }
}

function initializeMarketData() {
    if (window.dashboard) {
        window.dashboard.loadMarketData();
    }
}

// Global functions for button interactions
function refreshData() {
    if (window.dashboard) {
        window.dashboard.loadMarketData();
    }
}

function changeSymbol() {
    if (window.dashboard) {
        window.dashboard.changeSymbol();
    }
}

function toggleAutoRefresh() {
    if (!window.dashboard) return;
    
    const autoRefreshText = document.getElementById('autoRefreshText');
    const autoRefreshIcon = document.getElementById('autoRefreshIcon');
    
    if (window.dashboard.autoRefreshEnabled) {
        window.dashboard.autoRefreshEnabled = false;
        clearInterval(window.dashboard.refreshInterval);
        autoRefreshText.textContent = 'Enable Auto-Refresh';
        autoRefreshIcon.className = 'fas fa-clock';
    } else {
        window.dashboard.autoRefreshEnabled = true;
        window.dashboard.refreshInterval = setInterval(() => {
            window.dashboard.loadMarketData();
        }, 30000); // Refresh every 30 seconds
        autoRefreshText.textContent = 'Disable Auto-Refresh';
        autoRefreshIcon.className = 'fas fa-pause';
    }
}

// Initialize dashboard when page loads
let dashboard;
document.addEventListener('DOMContentLoaded', function() {
    dashboard = new MarketSentimentDashboard();
    // Make dashboard globally available
    window.dashboard = dashboard;
});

// Add market news simulation based on asset type
const marketNews = {
    index: [
        "Major indices show strong momentum on positive economic data",
        "Federal Reserve policy meeting influences global market sentiment",
        "Quarterly earnings season drives index volatility",
        "Geopolitical tensions create uncertainty in global markets"
    ],
    stock: [
        "Strong quarterly earnings boost individual stock performance",
        "Sector rotation continues as investors seek growth opportunities",
        "Institutional buying activity increases in technology stocks",
        "Analyst upgrades drive momentum in selected equities"
    ],
    crypto: [
        "Regulatory clarity improves cryptocurrency market sentiment",
        "Institutional adoption continues to drive crypto prices",
        "Market volatility reflects ongoing crypto market maturation",
        "DeFi innovations attract increased investor attention"
    ],
    commodity: [
        "Supply chain disruptions impact commodity pricing",
        "Weather patterns influence agricultural commodity markets",
        "Industrial demand drives precious metals higher",
        "Energy transition affects traditional commodity sectors"
    ]
};

// Function to get relevant market news based on current symbol
function getRelevantNews() {
    const symbolType = dashboard.getSymbolInfo(dashboard.currentSymbol).type;
    const newsArray = marketNews[symbolType] || marketNews.index;
    return newsArray[Math.floor(Math.random() * newsArray.length)];
}
