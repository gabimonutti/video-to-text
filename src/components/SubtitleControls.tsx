import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { FiBold, FiItalic, FiAlignCenter, FiAlignLeft, FiAlignRight } from 'react-icons/fi';

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
    <Card className="w-full max-w-3xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Subtitle Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="font-size">Font Size</Label>
                <span className="text-sm text-muted-foreground">{style.fontSize}px</span>
              </div>
              <Slider
                id="font-size"
                min={12}
                max={48}
                step={1}
                value={[style.fontSize]}
                onValueChange={(values) => handleChange('fontSize', values[0])}
              />
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <Label htmlFor="font-family">Font</Label>
              <select
                id="font-family"
                value={style.fontFamily}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
              >
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Color */}
            <div className="space-y-2">
              <Label htmlFor="text-color">Text Color</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  id="text-color"
                  value={style.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="w-12 h-8 p-1"
                />
                <Input
                  type="text"
                  value={style.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="flex-1"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            {/* Background Color */}
            <div className="space-y-2">
              <Label htmlFor="bg-color">Background Color</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  id="bg-color"
                  value={style.backgroundColor}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="w-12 h-8 p-1"
                />
                <Input
                  type="text"
                  value={style.backgroundColor}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="opacity">Background Opacity</Label>
                <span className="text-sm text-muted-foreground">{Math.round(style.opacity * 100)}%</span>
              </div>
              <Slider
                id="opacity"
                min={0}
                max={1}
                step={0.05}
                value={[style.opacity]}
                onValueChange={(values) => handleChange('opacity', values[0])}
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <select
                id="position"
                value={style.position}
                onChange={(e) => handleChange('position', e.target.value as 'top' | 'bottom')}
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
              >
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
              </select>
            </div>
          </div>

          {/* Text Style and Alignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Text Style</Label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleChange('bold', !style.bold)}
                  className={`p-2 rounded-md ${
                    style.bold ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                  aria-pressed={style.bold}
                >
                  <FiBold className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleChange('italic', !style.italic)}
                  className={`p-2 rounded-md ${
                    style.italic ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                  aria-pressed={style.italic}
                >
                  <FiItalic className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alignment</Label>
              <ToggleGroup 
                type="single" 
                value={style.alignment}
                onValueChange={(value) => {
                  if (value) handleChange('alignment', value as 'left' | 'center' | 'right');
                }}
              >
                <ToggleGroupItem value="left">
                  <FiAlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center">
                  <FiAlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right">
                  <FiAlignRight className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Subtitle Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div 
              className="bg-gray-800 p-4 rounded-md flex justify-center items-center h-16"
            >
              <div 
                style={{
                  color: style.color,
                  backgroundColor: `${style.backgroundColor}${Math.round(style.opacity * 255).toString(16).padStart(2, '0')}`,
                  fontFamily: style.fontFamily,
                  fontSize: `${style.fontSize}px`,
                  fontWeight: style.bold ? 'bold' : 'normal',
                  fontStyle: style.italic ? 'italic' : 'normal',
                  textAlign: style.alignment,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  maxWidth: '100%',
                }}
              >
                Sample subtitle text
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 