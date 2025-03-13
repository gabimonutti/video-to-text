import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { FiBold, FiItalic, FiAlignCenter, FiAlignLeft, FiAlignRight, FiType, FiSettings, FiSliders, FiDroplet, FiGrid } from 'react-icons/fi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';

export interface SubtitleStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  opacity: number;
  bold: boolean;
  italic: boolean;
  alignment: 'left' | 'center' | 'right';
  position: 'top' | 'bottom';
  noBackground: boolean;
  customPosition: boolean;
  xPosition: number;
  yPosition: number;
}

interface SubtitleControlsProps {
  style: SubtitleStyle;
  onChange: (style: SubtitleStyle) => void;
}

const fontOptions = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Courier New, monospace', label: 'Courier' },
  { value: 'Impact, sans-serif', label: 'Impact' },
];

export function SubtitleControls({ style, onChange }: SubtitleControlsProps) {
  const handleChange = <K extends keyof SubtitleStyle>(key: K, value: SubtitleStyle[K]) => {
    onChange({ ...style, [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full border-primary/10 shadow-sm">
        <CardHeader className="pb-3 space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FiType className="h-5 w-5 text-primary" />
            Subtitle Settings
          </CardTitle>
          <CardDescription>
            Customize how captions appear in your video
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <Tabs defaultValue="style" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="style" className="flex items-center gap-1.5 text-xs">
                <FiType className="h-3 w-3" />
                <span>Text Style</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-1.5 text-xs">
                <FiDroplet className="h-3 w-3" />
                <span>Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="position" className="flex items-center gap-1.5 text-xs">
                <FiGrid className="h-3 w-3" />
                <span>Position</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="style" className="space-y-4">
              {/* Font Family */}
              <div className="space-y-2">
                <Label htmlFor="font-family" className="text-sm flex items-center gap-1">
                  <span>Font Family</span>
                </Label>
                <select
                  id="font-family"
                  value={style.fontFamily}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('fontFamily', e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="font-size" className="text-sm flex items-center gap-1">
                    <span>Font Size</span>
                  </Label>
                  <span className="text-sm text-muted-foreground">{style.fontSize}px</span>
                </div>
                <Slider
                  id="font-size"
                  min={12}
                  max={48}
                  step={1}
                  value={[style.fontSize]}
                  onValueChange={(values: number[]) => handleChange('fontSize', values[0])}
                  className="cursor-pointer"
                />
              </div>
              
              {/* Text Style */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <span>Text Style</span>
                </Label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleChange('bold', !style.bold)}
                    className={`p-2 rounded-md transition-colors ${
                      style.bold ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-muted-foreground border border-transparent'
                    }`}
                    aria-pressed={style.bold}
                  >
                    <FiBold className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleChange('italic', !style.italic)}
                    className={`p-2 rounded-md transition-colors ${
                      style.italic ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-muted-foreground border border-transparent'
                    }`}
                    aria-pressed={style.italic}
                  >
                    <FiItalic className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Text Alignment */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <span>Text Alignment</span>
                </Label>
                <ToggleGroup 
                  type="single" 
                  value={style.alignment}
                  onValueChange={(value) => {
                    if (value) handleChange('alignment', value as 'left' | 'center' | 'right');
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="left" aria-label="Align left">
                    <FiAlignLeft className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="center" aria-label="Align center">
                    <FiAlignCenter className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="right" aria-label="Align right">
                    <FiAlignRight className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </TabsContent>
            
            <TabsContent value="appearance" className="space-y-4">
              {/* Text Color */}
              <div className="space-y-2">
                <Label htmlFor="text-color" className="text-sm flex items-center gap-1">
                  <span>Text Color</span>
                </Label>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Input
                      type="color"
                      id="text-color"
                      value={style.color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('color', e.target.value)}
                      className="w-12 h-8 p-1 cursor-pointer"
                    />
                    <div 
                      className="absolute inset-0 pointer-events-none rounded border border-input"
                      style={{ backgroundColor: style.color }}
                    />
                  </div>
                  <Input
                    type="text"
                    value={style.color}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('color', e.target.value)}
                    className="flex-1"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
              
              {/* No Background Option */}
              <div className="flex items-center justify-between space-x-2 py-2 border-b border-border/50">
                <Label htmlFor="no-background" className="text-sm flex items-center gap-1 cursor-pointer">
                  <span>Text only (no background)</span>
                </Label>
                <Switch
                  id="no-background"
                  checked={style.noBackground}
                  onCheckedChange={(checked: boolean) => handleChange('noBackground', checked)}
                />
              </div>
              
              {/* Background Color - Only shown when noBackground is false */}
              {!style.noBackground && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bg-color" className="text-sm flex items-center gap-1">
                      <span>Background Color</span>
                    </Label>
                    <div className="flex space-x-2">
                      <div className="relative">
                        <Input
                          type="color"
                          id="bg-color"
                          value={style.backgroundColor}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('backgroundColor', e.target.value)}
                          className="w-12 h-8 p-1 cursor-pointer"
                        />
                        <div 
                          className="absolute inset-0 pointer-events-none rounded border border-input"
                          style={{ backgroundColor: style.backgroundColor }}
                        />
                      </div>
                      <Input
                        type="text"
                        value={style.backgroundColor}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('backgroundColor', e.target.value)}
                        className="flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  {/* Opacity - Only shown when noBackground is false */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="opacity" className="text-sm flex items-center gap-1">
                        <span>Background Opacity</span>
                      </Label>
                      <span className="text-sm text-muted-foreground">{Math.round(style.opacity * 100)}%</span>
                    </div>
                    <Slider
                      id="opacity"
                      min={0}
                      max={1}
                      step={0.05}
                      value={[style.opacity]}
                      onValueChange={(values: number[]) => handleChange('opacity', values[0])}
                      className="cursor-pointer"
                    />
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="position" className="space-y-4">
              {/* Position selector */}
              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm flex items-center gap-1">
                  <span>Subtitle Position</span>
                </Label>
                <select
                  id="position"
                  value={style.customPosition ? 'custom' : style.position}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const value = e.target.value;
                    if (value === 'custom') {
                      handleChange('customPosition', true);
                    } else {
                      handleChange('customPosition', false);
                      handleChange('position', value as 'top' | 'bottom');
                      
                      // Reset position to default when switching back from custom
                      if (style.customPosition) {
                        // When switching from custom to standard, reset X to center
                        handleChange('xPosition', 50);
                        
                        // Reset Y based on selected position (top or bottom)
                        if (value === 'top') {
                          handleChange('yPosition', 10);
                        } else {
                          handleChange('yPosition', 90);
                        }
                      }
                    }
                  }}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="bottom">Bottom of Video</option>
                  <option value="top">Top of Video</option>
                  <option value="custom">Custom Position</option>
                </select>
              </div>
              
              {/* Custom position controls */}
              {style.customPosition && (
                <>
                  <div className="rounded-md bg-muted/50 p-3 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-3 italic flex items-center gap-1.5">
                      <FiSettings className="h-3 w-3" />
                      <span>Tip: You can directly drag the subtitle text in the video to reposition it.</span>
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {/* X Position */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="x-position" className="text-sm">X Position</Label>
                          <span className="text-sm text-muted-foreground">{style.xPosition}%</span>
                        </div>
                        <Slider
                          id="x-position"
                          min={0}
                          max={100}
                          step={1}
                          value={[style.xPosition]}
                          onValueChange={(values: number[]) => handleChange('xPosition', values[0])}
                          className="cursor-pointer"
                        />
                      </div>
                      
                      {/* Y Position */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="y-position" className="text-sm">Y Position</Label>
                          <span className="text-sm text-muted-foreground">{style.yPosition}%</span>
                        </div>
                        <Slider
                          id="y-position"
                          min={0}
                          max={100}
                          step={1}
                          value={[style.yPosition]}
                          onValueChange={(values: number[]) => handleChange('yPosition', values[0])}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Preview - Always visible no matter which tab is active */}
          <div className="mt-6 space-y-2">
            <Label className="text-sm flex items-center gap-1">
              <span>Preview</span>
            </Label>
            <div 
              className="bg-zinc-900 p-6 rounded-md flex justify-center items-center h-16 relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900" />
              <div 
                style={{
                  color: style.color,
                  backgroundColor: style.noBackground ? 'transparent' : `${style.backgroundColor}${Math.round(style.opacity * 255).toString(16).padStart(2, '0')}`,
                  fontFamily: style.fontFamily,
                  fontSize: `${style.fontSize}px`,
                  fontWeight: style.bold ? 'bold' : 'normal',
                  fontStyle: style.italic ? 'italic' : 'normal',
                  textAlign: style.alignment,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  maxWidth: '100%',
                  textShadow: style.noBackground ? '0px 0px 2px rgba(0, 0, 0, 0.8)' : 'none',
                  position: 'relative',
                  zIndex: 10,
                }}
              >
                Sample subtitle text
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border/30 bg-muted/20 py-3">
          <p className="text-xs text-center w-full text-muted-foreground">
            Changes are applied in real-time to the video
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 